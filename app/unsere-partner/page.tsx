import type { Metadata } from 'next';
import { ArrowDown, ArrowUp, Globe2 } from 'lucide-react';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { isExternalUrl } from '@/lib/site';
import { addPartnerAction, movePartnerAction, removePartnerAction, updatePartnerAction } from './actions';

export const metadata: Metadata = {
  title: 'Unsere Partner – Headbang Handwerk',
  description: 'Partner und Unterstützer von Headbang Handwerk im Überblick.',
};

function getAdminErrorMessage(adminError?: string) {
  if (!adminError) {
    return null;
  }

  if (adminError === 'missing-config') {
    return 'Für Logo-Uploads fehlt aktuell die Firebase-Konfiguration. Prüfe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (adminError === 'invalid-firebase') {
    return 'Firebase ist gesetzt, aber ungültig formatiert. Prüfe besonders FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (adminError === 'firebase-auth') {
    return 'Firebase lehnt das Speichern ab. Prüfe den Service-Account und seine Rechte.';
  }

  if (adminError === 'logo-upload-bucket') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden, weil der Firebase-Storage-Bucket nicht gefunden wurde.';
  }

  if (adminError === 'logo-upload-permission') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden, weil dem Service Account Rechte auf Firebase Storage fehlen.';
  }

  if (adminError === 'logo-upload') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden. Prüfe Firebase Storage und den Service Account.';
  }

  if (adminError === 'missing-partner-fields') {
    return 'Bitte mindestens Partnername und Kurzbeschreibung ausfüllen.';
  }

  return 'Aktion fehlgeschlagen. Bitte Eingaben prüfen.';
}

export default async function UnserePartnerPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;
  const partners = cms.site.partners;
  const adminErrorMessage = getAdminErrorMessage(params?.adminError);

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin ? (
          <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                <h2 className="mt-2 text-2xl font-black text-white">Partner hinzufügen, bearbeiten und sortieren</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">Die Überschriften und Fließtexte auf dieser Seite bleiben direkt per Live-Editor bearbeitbar. Hier unten verwaltest du die einzelnen Partner-Einträge.</p>
              </div>
              <div className="text-sm font-semibold">
                {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                {adminErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{adminErrorMessage}</p> : null}
              </div>
            </div>

            <form action={addPartnerAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
              <input name="name" placeholder="Name des Partners" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <input name="website" placeholder="Website des Partners" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-white">Logo hochladen</span>
                <input
                  type="file"
                  name="logoFile"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
              </label>
              <textarea name="description" rows={4} placeholder="Kurzbeschreibung" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Partner hinzufügen</button>
              </div>
            </form>
          </section>
        ) : null}

        <LiveResizableBox boxKey="partners.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partners.intro.box')} isAdmin={isAdmin} className="content-flow text-center mb-12 max-w-4xl mx-auto">
          <h1 className="page-title">
            <LiveEditableText as="span" className="inline" editorKey="partners.title" initialHtml={resolveLiveHtml(liveEditor, 'partners.title', 'Unsere Partner')} isAdmin={isAdmin} title="Partner Titel" />
          </h1>
          <LiveEditableText as="p" className="body-copy-lg" editorKey="partners.lead" initialHtml={resolveLiveHtml(liveEditor, 'partners.lead', 'Diese Unternehmen, Betriebe und Unterstützer begleiten Headbang Handwerk bereits auf dem Weg zu mehr Sichtbarkeit für das Handwerk.')} isAdmin={isAdmin} title="Partner Einleitung" />
        </LiveResizableBox>

        <LiveResizableBox boxKey="partners.list.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partners.list.box')} isAdmin={isAdmin} className="space-y-6">
          {partners.length ? (
            partners.map((partner, index) => (
              <div key={partner.id} className="section-shell content-box overflow-hidden sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-28 w-full max-w-[12rem] items-center justify-center overflow-hidden rounded-[1.3rem] border border-[color:var(--color-border)]/70 bg-black/15 p-4">
                      {partner.logo.assetUrl ? (
                        <img src={partner.logo.assetUrl} alt={`${partner.name} Logo`} className="max-h-full w-auto object-contain" />
                      ) : (
                        <div className="text-center text-sm font-semibold text-[color:var(--color-muted)]">Kein Logo hinterlegt</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="section-title text-[1.9rem] sm:text-[2.2rem]">{partner.name}</h2>
                      <p className="body-copy mt-4 max-w-3xl">{partner.description}</p>
                      {partner.website ? (
                        <div className="mt-5">
                          <a
                            href={partner.website}
                            target={isExternalUrl(partner.website) ? '_blank' : undefined}
                            rel={isExternalUrl(partner.website) ? 'noreferrer' : undefined}
                            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-black/10 px-4 py-3 text-sm font-bold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white"
                          >
                            <Globe2 className="h-4 w-4" />
                            Website besuchen
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="w-full rounded-[1.2rem] border border-white/8 bg-black/10 p-4 lg:w-[24rem]">
                      <form action={updatePartnerAction} className="grid gap-3">
                        <input type="hidden" name="id" value={partner.id} />
                        <input name="name" defaultValue={partner.name} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        <input name="website" defaultValue={partner.website} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        <textarea name="description" rows={4} defaultValue={partner.description} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-white">Neues Logo hochladen</span>
                          <input
                            type="file"
                            name="logoFile"
                            accept=".png,.jpg,.jpeg,.webp,.svg"
                            className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                          />
                        </label>
                        <label className="inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                          <input type="checkbox" name="removeLogo" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                          Vorhandenes Logo entfernen
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                        </div>
                      </form>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <form action={movePartnerAction}>
                          <input type="hidden" name="id" value={partner.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button type="submit" disabled={index === 0} className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-black text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40">
                            <ArrowUp className="h-4 w-4" />
                            Nach oben
                          </button>
                        </form>
                        <form action={movePartnerAction}>
                          <input type="hidden" name="id" value={partner.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button type="submit" disabled={index === partners.length - 1} className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-black text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40">
                            <ArrowDown className="h-4 w-4" />
                            Nach unten
                          </button>
                        </form>
                        <form action={removePartnerAction}>
                          <input type="hidden" name="id" value={partner.id} />
                          <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Entfernen</button>
                        </form>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : null}
        </LiveResizableBox>
      </div>
    </EditablePageShell>
  );
}