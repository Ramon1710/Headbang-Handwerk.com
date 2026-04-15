import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { SponsorPackageCard } from '@/components/sponsor-package-card';
import { Button } from '@/components/ui/button';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { Check } from 'lucide-react';
import { addSponsorPackageAction, removeSponsorPackageAction, updateSponsorPackageAction } from './actions';

export const metadata: Metadata = {
  title: 'Sponsoren – Headbang Handwerk',
  description: 'Sponsoring-Pakete für Headbang Handwerk. Sichert euch eure Sichtbarkeit auf unseren Festivals.',
};

export default async function SponsorenPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const sponsors = cms.site.sponsors;
  const sponsorPackages = cms.site.sponsorPackages;
  const liveEditor = cms.site.liveEditor;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isAdmin ? (
            <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Sponsoring-Pakete hinzufügen, ändern und entfernen</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">Diese Paketdaten steuern die Karten auf dieser Seite, die Startseiten-Vorschau und den Checkout.</p>
                </div>
                <div className="text-sm font-semibold">
                  {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                  {params?.adminError ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">Aktion fehlgeschlagen. Bitte Name, Preis und mindestens ein Feature prüfen.</p> : null}
                </div>
              </div>

              <form action={addSponsorPackageAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
                <input name="name" placeholder="Paketname" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="price" type="number" min="0" step="0.01" placeholder="Preis in EUR" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="visibility" placeholder="Sichtbarkeit" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="logoSize" placeholder="Logogröße" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="placement" placeholder="Platzierung" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="id" placeholder="Optionale ID" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <textarea name="features" rows={5} placeholder="Features, je Zeile ein Punkt" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <label className="inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                  <input type="checkbox" name="highlighted" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20 text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]" />
                  Als empfohlenes Paket markieren
                </label>
                <div className="lg:col-span-2 flex justify-end">
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Paket hinzufügen</button>
                </div>
              </form>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {sponsorPackages.map((pkg) => (
                  <div key={pkg.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                    <form action={updateSponsorPackageAction} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="id" value={pkg.id} />
                      <input name="name" defaultValue={pkg.name} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="price" type="number" min="0" step="0.01" defaultValue={pkg.price} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="visibility" defaultValue={pkg.visibility} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="logoSize" defaultValue={pkg.logoSize} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="placement" defaultValue={pkg.placement} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">ID: {pkg.id}</div>
                      <textarea name="features" rows={5} defaultValue={pkg.features.join('\n')} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <label className="inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)] md:col-span-2">
                        <input type="checkbox" name="highlighted" defaultChecked={pkg.highlighted} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20 text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]" />
                        Als empfohlenes Paket markieren
                      </label>
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                      </div>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <form action={removeSponsorPackageAction}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Entfernen</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <LiveResizableBox boxKey="sponsors.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.intro.box')} isAdmin={isAdmin} className="content-flow text-center mb-14 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              <LiveEditableText as="span" className="inline" editorKey="sponsors.title" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.title', sponsors.title)} isAdmin={isAdmin} title="Sponsoren Titel" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="sponsors.accentWord" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.accentWord', sponsors.accentWord)} isAdmin={isAdmin} title="Sponsoren Hervorhebung" />
            </h1>
            <LiveEditableText as="p" className="text-lg text-gray-400" editorKey="sponsors.lead" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.lead', sponsors.lead)} isAdmin={isAdmin} title="Sponsoren Einleitung" />
          </LiveResizableBox>

          <LiveResizableBox boxKey="sponsors.benefits.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.benefits.box')} isAdmin={isAdmin} className="section-shell p-8 mb-14 text-center">
            <LiveEditableText as="h2" className="mb-6 text-xl font-bold text-white" editorKey="sponsors.benefitsTitle" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.benefitsTitle', sponsors.benefitsTitle)} isAdmin={isAdmin} title="Sponsoren Vorteile Titel" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.benefits.map((b, index) => (
                <LiveResizableBox key={b} boxKey={`sponsors.benefits.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `sponsors.benefits.${index}.box`)} isAdmin={isAdmin} className="flex items-start justify-center gap-3 text-center">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
                  <LiveEditableText as="span" className="text-sm text-gray-300" editorKey={`sponsors.benefits.${index}`} initialHtml={resolveLiveHtml(liveEditor, `sponsors.benefits.${index}`, b)} isAdmin={isAdmin} title={`Sponsoren Vorteil ${index + 1}`} />
                </LiveResizableBox>
              ))}
            </div>
          </LiveResizableBox>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
            {sponsorPackages.map((pkg, index) => (
              <LiveResizableBox key={pkg.id} boxKey={`sponsors.packages.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `sponsors.packages.${index}.box`)} isAdmin={isAdmin} className="h-full">
                <SponsorPackageCard pkg={pkg} />
              </LiveResizableBox>
            ))}
          </div>

          <LiveResizableBox boxKey="sponsors.custom.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.custom.box')} isAdmin={isAdmin} className="section-shell content-flow text-center p-8">
            <LiveEditableText as="h3" className="text-xl font-bold text-white" editorKey="sponsors.customPackageTitle" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageTitle', sponsors.customPackageTitle)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket Titel" />
            <LiveEditableText as="p" className="mx-auto max-w-lg text-sm text-gray-300" editorKey="sponsors.customPackageText" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageText', sponsors.customPackageText)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket Text" />
            <Button href={sponsors.customPackageCtaHref} size="md">
              <LiveEditableText as="span" className="inline" editorKey="sponsors.customPackageCtaLabel" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageCtaLabel', sponsors.customPackageCtaLabel)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket CTA" />
            </Button>
          </LiveResizableBox>
        </div>
    </EditablePageShell>
  );
}
