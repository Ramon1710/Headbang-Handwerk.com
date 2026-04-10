'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [pendingStyles, setPendingStyles] = useState<Record<string, PendingBoxStyle>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

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