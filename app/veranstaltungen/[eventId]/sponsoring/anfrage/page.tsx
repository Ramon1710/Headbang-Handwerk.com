import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { submitEventSponsoringRequestAction } from './actions';
import { getCmsContent } from '@/lib/cms/storage';
import { getEventSponsoringConfigByEventId, listEventSponsoringPackagesByEventId } from '@/lib/event-sponsoring/store';
import { resolveEventDetailViewMode } from '@/lib/events';
import { formatEuroCents } from '@/lib/event-sponsoring/money';
import { createEventSponsoringRequestIdempotencyKey } from '@/lib/event-sponsoring/request';

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  return {
    title: event ? `Sponsoringanfrage – ${event.festivalName || event.title}` : 'Sponsoringanfrage – Headbang Handwerk',
    robots: {
      index: false,
      follow: false,
    },
  };
}

function getSupportTypeOptions() {
  return [
    ['material', 'Material'],
    ['stand_construction', 'Standbau'],
    ['interactive_activity', 'Mitmachaktion'],
    ['tools_or_machines', 'Werkzeuge oder Maschinen'],
    ['transport', 'Transport oder Logistik'],
    ['personnel', 'Personal'],
    ['financial', 'Finanzielle Unterstuetzung'],
    ['other', 'Sonstiges'],
  ] as const;
}

function getPublicErrorMessage(errorCode?: string) {
  if (errorCode === 'consent') {
    return 'Bitte bestaetigt die erforderlichen Hinweise zur Datenverarbeitung, Rechnungszahlung und Logoplatzierung.';
  }

  if (errorCode === 'upload') {
    return 'Die Anfrage konnte wegen der hochgeladenen Datei nicht gespeichert werden. Bitte prueft Dateityp und Dateigroesse und versucht es erneut.';
  }

  return 'Die Anfrage konnte gerade nicht gespeichert werden. Bitte versucht es in wenigen Minuten erneut oder meldet euch direkt per E-Mail.';
}

export default async function EventSponsoringRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ package?: string; submitted?: string; ref?: string; error?: string }>;
}) {
  const { eventId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  if (!event || resolveEventDetailViewMode(event) !== 'sponsoring2d') {
    notFound();
  }

  const [config, packages] = await Promise.all([
    getEventSponsoringConfigByEventId(eventId),
    listEventSponsoringPackagesByEventId(eventId),
  ]);

  if (!config?.enabled) {
    notFound();
  }

  const pkg = packages.find((entry) => entry.id === query?.package && entry.active);

  if (!pkg) {
    notFound();
  }

  const requiresLogo = pkg.grantsBannerPlacement && pkg.logoSlotSize !== 'none';
  const isCustom = pkg.kind === 'custom_request';
  const isAnonymous = pkg.kind === 'anonymous_support';
  const idempotencyKey = createEventSponsoringRequestIdempotencyKey();
  const submitted = query?.submitted === '1';

  return (
    <main className="min-h-screen bg-transparent px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[1.9rem] border border-[color:var(--color-border)]/80 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(10,7,5,0.76)_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <a href={`/veranstaltungen/${encodeURIComponent(event.id)}/sponsoring`} className="inline-flex items-center rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">
            Zurueck zur Sponsoringseite
          </a>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Sponsoringanfrage</p>
          <h1 className="mt-3 text-4xl font-black text-[color:var(--color-foreground)]">{pkg.name}</h1>
          <p className="mt-3 text-base leading-8 text-[color:var(--color-muted)]">{pkg.description}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
            <span className="rounded-full border border-white/10 px-4 py-2">{event.festivalName || event.title}</span>
            <span className="rounded-full border border-white/10 px-4 py-2">{formatEuroCents(pkg.kind === 'anonymous_support' && pkg.priceCents <= 0 ? config.anonymousMinimumAmountCents : pkg.priceCents)}</span>
            {pkg.logoSlotSize !== 'none' ? <span className="rounded-full border border-white/10 px-4 py-2">Logoformat {pkg.logoSlotSize}</span> : null}
          </div>
          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/15 p-5 text-sm text-[color:var(--color-muted)]">
            <p className="font-semibold text-[color:var(--color-foreground)]">Leistungen dieses Pakets</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {pkg.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </section>

        {submitted ? (
          <section className="rounded-[1.6rem] border border-green-500/35 bg-green-950/20 p-6 text-green-100">
            <h2 className="text-2xl font-black">Anfrage gespeichert</h2>
            <p className="mt-3 text-sm leading-7">Vielen Dank. Eure Sponsoringanfrage fuer {event.festivalName || event.title} zum Paket {pkg.name} wurde entgegengenommen. Headbang Handwerk prueft die Anfrage und meldet sich anschliessend mit der weiteren Abstimmung und der spaeteren Rechnung.</p>
            {query?.ref ? <p className="mt-3 text-sm font-semibold">Referenz: {query.ref}</p> : null}
            <p className="mt-3 text-sm leading-7">Die Zahlung erfolgt nicht online, sondern spaeter manuell per Rechnung. Die Logoplatzierung erfolgt durch Headbang Handwerk.</p>
          </section>
        ) : null}

        {query?.error ? (
          <section className="rounded-[1.6rem] border border-red-500/35 bg-red-950/20 p-6 text-red-100">
            <h2 className="text-2xl font-black">Anfrage konnte nicht gespeichert werden</h2>
            <p className="mt-3 text-sm leading-7">{getPublicErrorMessage(query.error)}</p>
          </section>
        ) : null}

        {!submitted ? (
        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <form action={submitEventSponsoringRequestAction} className="grid gap-5 lg:grid-cols-2">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="packageId" value={pkg.id} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Firmenname</span>
              <input name="companyName" required maxLength={160} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Unternehmens-Website</span>
              <input name="companyWebsite" type="url" placeholder="https://" maxLength={240} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Vorname</span>
              <input name="contactFirstName" required maxLength={80} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Nachname</span>
              <input name="contactLastName" required maxLength={80} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">E-Mail</span>
              <input name="email" type="email" required maxLength={320} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Telefon</span>
              <input name="phone" required maxLength={60} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Strasse</span>
              <input name="billingStreet" required maxLength={160} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Hausnummer</span>
              <input name="billingHouseNumber" required maxLength={40} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">PLZ</span>
              <input name="billingPostalCode" required maxLength={20} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Ort</span>
              <input name="billingCity" required maxLength={120} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Land</span>
              <input name="billingCountryCode" defaultValue="DE" required maxLength={3} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            {isCustom ? (
              <fieldset className="lg:col-span-2 rounded-[1.4rem] border border-[color:var(--color-border)]/70 bg-black/10 p-5">
                <legend className="px-2 text-sm font-semibold text-[color:var(--color-foreground)]">Art der Unterstuetzung</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {getSupportTypeOptions().map(([value, label]) => (
                    <label key={value} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
                      <input type="checkbox" name="supportTypes" value={value} className="h-4 w-4" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Nachricht{isCustom ? ' zur Anfrage' : ' an Headbang Handwerk'}</span>
              <textarea name="message" rows={6} required={isCustom} maxLength={8000} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
            </label>

            {!isAnonymous ? (
              <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)] lg:col-span-2">
                <input type="checkbox" name="publicDisplayEnabled" defaultChecked className="h-4 w-4" />
                Oeffentliche Darstellung von Firmenname und Logo nach Abstimmung erwuenscht
              </label>
            ) : null}

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">{requiresLogo ? 'Logo-Datei' : 'Logo-Datei oder Unterlage optional'}</span>
              <input name="logoFile" type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" required={requiresLogo} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)]" />
              <p className="mt-2 text-xs text-[color:var(--color-muted)]">Erlaubt sind PNG, JPG, WEBP oder PDF bis 5 MB. SVG ist ausgeschlossen.</p>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)] lg:col-span-2">
              <input type="checkbox" name="acceptDataProcessing" required className="h-4 w-4" />
              Ich willige in die Verarbeitung der uebermittelten Daten zur Bearbeitung der Sponsoringanfrage ein.
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)] lg:col-span-2">
              <input type="checkbox" name="acceptInvoicePayment" required className="h-4 w-4" />
              Ich nehme zur Kenntnis, dass die Zahlung spaeter manuell per Rechnung erfolgt.
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)] lg:col-span-2">
              <input type="checkbox" name="acceptManualLogoPlacement" required className="h-4 w-4" />
              Ich nehme zur Kenntnis, dass die Logoplatzierung nicht selbst gewaehlt wird, sondern durch Headbang Handwerk erfolgt.
            </label>

            <div className="lg:col-span-2 rounded-[1.4rem] border border-[color:var(--color-border)]/70 bg-black/10 p-5 text-sm leading-7 text-[color:var(--color-muted)]">
              Nach dem Absenden wird die Anfrage gespeichert und intern per E-Mail weitergeleitet. Eine Zahlung im Browser findet nicht statt. Die Abrechnung erfolgt nach Rueckmeldung manuell per Rechnung.
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Anfrage absenden</button>
            </div>
          </form>
        </section>
        ) : null}
      </div>
    </main>
  );
}