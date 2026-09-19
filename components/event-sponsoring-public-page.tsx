import { EditablePageShell } from '@/components/editable-page-shell';
import { Button } from '@/components/ui/button';
import type { CmsContent } from '@/lib/cms/schema';
import type { EventSponsoringPublicPageView } from '@/lib/event-sponsoring/public';

interface EventSponsoringPublicPageProps {
  cms: CmsContent;
  isAdmin: boolean;
  view: EventSponsoringPublicPageView;
  adminManageHref: string;
}

function getPackageAccent(kind: EventSponsoringPublicPageView['packages'][number]['kind']) {
  if (kind === 'small_logo') {
    return 'border-sky-400/30 bg-sky-950/20';
  }

  if (kind === 'medium_logo') {
    return 'border-amber-400/30 bg-amber-950/20';
  }

  return 'border-rose-400/30 bg-rose-950/20';
}

export function EventSponsoringPublicPage({ cms, isAdmin, view, adminManageHref }: EventSponsoringPublicPageProps) {
  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-24 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href="/veranstaltungen" className="link-copy inline-flex items-center gap-2 self-start rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-2 text-sm font-semibold transition hover:border-[color:var(--color-accent)]">
            Zurück zu Veranstaltungen
          </a>
          {view.isAdminPreview ? (
            <a href={adminManageHref} className="rounded-xl border border-[color:var(--color-accent)]/50 bg-black/15 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">
              Sponsoringverwaltung öffnen
            </a>
          ) : null}
        </div>

        <section className="rounded-[2rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(27,18,10,0.88)_0%,rgba(12,8,6,0.82)_100%)] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          {view.isAdminPreview ? (
            <div className="mb-6 rounded-2xl border border-amber-500/35 bg-amber-950/35 px-5 py-4 text-sm font-semibold text-amber-100">
              Admin-Vorschau – Diese Sponsoringseite ist noch nicht öffentlich aktiviert.
            </div>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Veranstaltungs-Sponsoring</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{view.event.festivalName || view.event.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
            {view.event.date ? <span className="rounded-full border border-white/10 px-4 py-2">{view.event.date}</span> : null}
            {view.event.location ? <span className="rounded-full border border-white/10 px-4 py-2">{view.event.location}</span> : null}
          </div>
          <h2 className="mt-8 text-3xl font-black text-white">{view.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--color-muted)]">{view.description}</p>
        </section>

        <section className="mt-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Sponsorenpakete</p>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--color-foreground)]">Pakete für Sponsoringanfragen</h2>
            </div>
            <p className="text-sm text-[color:var(--color-muted)]">Die Anfrage wird geprüft, abgestimmt und anschließend manuell per Rechnung abgewickelt.</p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {view.packages.map((pkg) => (
              <article key={pkg.id} className={`rounded-[1.5rem] border p-5 ${getPackageAccent(pkg.kind)}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-black text-white">{pkg.name}</h3>
                  {pkg.logoSizeLabel ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">{pkg.logoSizeLabel}</span> : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">{pkg.description}</p>
                <p className="mt-4 text-3xl font-black text-white">{pkg.priceLabel}</p>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-foreground)]">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">{feature}</li>
                  ))}
                </ul>
                {pkg.actionEnabled && pkg.actionHref ? (
                  <Button href={pkg.actionHref} size="lg" className="mt-5 w-full justify-center">
                    {pkg.actionLabel}
                  </Button>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm font-semibold text-[color:var(--color-muted)]">
                    {pkg.actionLabel}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Weiterer Ablauf</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {view.processSteps.map((step, index) => (
              <li key={step} className="rounded-xl border border-white/8 bg-black/10 px-4 py-4 text-sm text-[color:var(--color-foreground)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent-soft)]">Schritt {index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </EditablePageShell>
  );
}