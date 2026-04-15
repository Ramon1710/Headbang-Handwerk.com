'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PendingBoxStyle {
  width?: string;
  height?: string;
  minHeight?: string;
  x?: string;
  y?: string;
}

interface LiveLayoutSaveContextValue {
  setPendingStyle: (boxKey: string, style: PendingBoxStyle) => void;
}

const LiveLayoutSaveContext = createContext<LiveLayoutSaveContextValue | null>(null);

export function LiveLayoutSaveProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingStyles, setPendingStyles] = useState<Record<string, PendingBoxStyle>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [isEmbeddedPreview, setIsEmbeddedPreview] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsEmbeddedPreview(window.self !== window.top);
  }, []);

  const previewParams = new URLSearchParams(searchParams.toString());
  const isEmbeddedPreviewRequest = previewParams.get('adminDevicePreview') === '1';

  if (!isEmbeddedPreviewRequest) {
    previewParams.set('adminDevicePreview', '1');
  }

  const previewSearch = previewParams.toString();
  const previewSrc = previewSearch ? `${pathname}?${previewSearch}` : pathname;

  const value = useMemo<LiveLayoutSaveContextValue>(
    () => ({
      setPendingStyle: (boxKey, style) => {
        setPendingStyles((current) => ({
          ...current,
          [boxKey]: style,
        }));
      },
    }),
    []
  );

  async function saveAll() {
    const entries = Object.entries(pendingStyles);

    if (!entries.length) {
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      for (const [key, style] of entries) {
        const response = await fetch('/api/cms/live-editor', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({
            kind: 'boxStyle',
            key,
            style,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
          throw new Error(payload?.detail ? `${payload?.error || 'save-failed'}:${payload.detail}` : payload?.error || `save-failed:${key}`);
        }
      }

      setPendingStyles({});
      setSaveMessage('Layout gespeichert');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'save-failed';
      const [code, detail] = message.split(':', 2);

      setSaveError(
        code === 'missing-config'
          ? 'Speichern nicht moeglich. Auf Vercel fehlt noch die Firebase-Konfiguration fuer dauerhafte CMS-Aenderungen.'
          : code === 'invalid-firebase'
          ? 'Speichern fehlgeschlagen. Firebase ist gesetzt, aber der Service-Account-Key ist ungueltig oder falsch formatiert.'
          : code === 'firebase-auth'
          ? 'Speichern fehlgeschlagen. Der Service Account darf aktuell nicht nach Firebase schreiben.'
          : code === 'route-failure' || code === 'unknown-save-error'
          ? `Speichern fehlgeschlagen. Technischer Fehler: ${detail || 'unbekannt'}`
          : 'Speichern fehlgeschlagen. Bitte erneut versuchen.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <LiveLayoutSaveContext.Provider value={value}>
      {children}
      {enabled && !isEmbeddedPreview && !isEmbeddedPreviewRequest ? (
        <>
          <div className="fixed right-4 top-24 z-[71] flex items-center gap-3 rounded-2xl border border-[#ff9d3c]/50 bg-[#130d09]/92 px-4 py-3 text-sm text-[#f4e5d2] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#ffcf98]">Smartphone-Ansicht</p>
              <p className="mt-1 text-xs text-[#d6bea3]">Direkt im Preview bearbeiten, um Mobile-Layout separat zu speichern.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMobilePreview((current) => !current)}
              className="rounded-xl border border-[#ff9d3c]/45 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f7e8d1] transition hover:border-[#ffb14d] hover:text-white"
            >
              {showMobilePreview ? 'Ausblenden' : 'Einblenden'}
            </button>
          </div>
          {showMobilePreview ? (
            <div className="fixed bottom-4 right-4 z-[69] hidden w-[25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border border-[#ff9d3c]/45 bg-[#130d09]/94 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm xl:block">
              <div className="flex items-center justify-between border-b border-[#ff9d3c]/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffcf98]">
                <span>Smartphone Preview</span>
                <span>390 px</span>
              </div>
              <div className="bg-[radial-gradient(circle_at_top,#2d170c_0%,#120b07_62%)] p-4">
                <div className="mx-auto w-[390px] max-w-full overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#090604] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                  <iframe
                    title="Smartphone Vorschau"
                    src={previewSrc}
                    className="block h-[78vh] min-h-[42rem] w-full border-0 bg-[#090604]"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {enabled && Object.keys(pendingStyles).length ? (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-[#ff9d3c]/50 bg-[#140d09]/94 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <p className="text-sm font-semibold text-[#f5e4cf]">
              {Object.keys(pendingStyles).length} Layout-Änderung{Object.keys(pendingStyles).length === 1 ? '' : 'en'} offen
            </p>
            <button
              type="button"
              onClick={saveAll}
              disabled={isSaving}
              className="rounded-xl bg-[#ff8a28] px-4 py-2 text-sm font-black text-black disabled:opacity-60"
            >
              {isSaving ? 'Speichert...' : 'Startseite speichern'}
            </button>
          </div>
          {saveError ? <p className="mt-2 text-sm font-semibold text-red-300">{saveError}</p> : null}
        </div>
      ) : null}
      {enabled && !Object.keys(pendingStyles).length && saveMessage ? (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-green-500/40 bg-green-950/60 px-4 py-3 text-sm font-semibold text-green-200 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-sm">
          {saveMessage}
        </div>
      ) : null}
    </LiveLayoutSaveContext.Provider>
  );
}

export function useLiveLayoutSave() {
  return useContext(LiveLayoutSaveContext);
}