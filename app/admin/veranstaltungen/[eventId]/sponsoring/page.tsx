import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireHeadbangAdmin } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';
import { hasFirebaseConfig } from '@/lib/cms/firebase';
import { EventSponsoringBannerEditor } from '@/components/event-sponsoring-banner-editor';
import {
  buildEventSponsoringCapacitySummary,
  buildEventSponsoringConfigDraft,
  EVENT_SPONSORING_PACKAGE_KIND_ORDER,
  getActiveBannerSlotWarnings,
  getEventSponsoringPackageKindInvariants,
} from '@/lib/event-sponsoring/admin';
import { formatEuroCents, formatEuroCentsForInput } from '@/lib/event-sponsoring/money';
import {
  getEventSponsoringConfigByEventId,
  getEventSponsoringLogoUploadById,
  listEventSponsoringBannersByEventId,
  listEventSponsoringBookingsByEventId,
  listEventSponsoringPackagesByEventId,
  listEventSponsoringRequestsByEventId,
  listEventSponsoringSlotsByBannerId,
  listEventSponsoringSlotsByEventId,
} from '@/lib/event-sponsoring/store';
import { resolveEventDetailViewMode } from '@/lib/events';
import {
  saveEventSponsoringBannerAction,
  saveEventSponsoringBannerLayoutAction,
  saveEventDetailViewModeAction,
  saveEventSponsoringConfigAction,
  saveEventSponsoringPackageAction,
  retryEventSponsoringRequestEmailAction,
  seedEventSponsoringBannersAction,
  seedEventSponsoringPackagesAction,
  seedEventSponsoringSlotsAction,
  updateEventSponsoringRequestStatusAction,
} from './actions';
import { getEventSponsoringHref } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Event-Sponsoring Verwaltung – Headbang Handwerk',
};

function getSavedMessage(saved?: string) {
  if (saved === 'detail-view') {
    return 'Die Detailansicht der Veranstaltung wurde gespeichert.';
  }

  if (saved === 'config') {
    return 'Die Sponsoring-Grundkonfiguration wurde gespeichert.';
  }

  if (saved === 'packages-defaults-created') {
    return 'Fehlende Standardpakete wurden angelegt.';
  }

  if (saved === 'packages-defaults-already-present') {
    return 'Alle Standardpakete waren bereits vorhanden.';
  }

  if (saved === 'package-updated') {
    return 'Das Sponsoring-Paket wurde gespeichert.';
  }

  if (saved === 'banners-defaults-created') {
    return 'Fehlende Standardbanner wurden angelegt.';
  }

  if (saved === 'banners-defaults-already-present') {
    return 'Die zwei Standardbanner waren bereits vorhanden.';
  }

  if (saved === 'slots-defaults-created') {
    return 'Standardpositionen wurden für freie Banner angelegt.';
  }

  if (saved === 'slots-defaults-already-present') {
    return 'Alle Banner besitzen bereits aktive Positionen.';
  }

  if (saved === 'banner-updated') {
    return 'Die Bannerdaten wurden gespeichert.';
  }

  if (saved === 'banner-layout-updated') {
    return 'Das Bannerlayout wurde gespeichert.';
  }

  if (saved === 'request-status-updated') {
    return 'Der Status der Sponsoringanfrage wurde gespeichert.';
  }

  if (saved === 'request-email-retried') {
    return 'Der interne Mailversand fuer die Sponsoringanfrage wurde erneut angestossen.';
  }

  return null;
}

function getRequestStatusLabel(status: string) {
  if (status === 'new') {
    return 'Neu';
  }

  if (status === 'invoice_pending') {
    return 'Rechnung vorbereiten';
  }

  if (status === 'invoice_sent') {
    return 'Rechnung versendet';
  }

  if (status === 'accepted') {
    return 'Angenommen';
  }

  if (status === 'declined') {
    return 'Abgelehnt';
  }

  return 'Archiviert';
}

function getEmailStateLabel(state: string) {
  if (state === 'pending') {
    return 'Ausstehend';
  }

  if (state === 'sending') {
    return 'Wird versendet';
  }

  if (state === 'sent') {
    return 'Versendet';
  }

  return 'Fehlgeschlagen';
}

function getPackageKindLabel(kind: (typeof EVENT_SPONSORING_PACKAGE_KIND_ORDER)[number]) {
  if (kind === 'small_logo') {
    return 'Kleines Logo';
  }

  if (kind === 'medium_logo') {
    return 'Mittleres Logo';
  }

  if (kind === 'large_logo') {
    return 'Großes Logo';
  }

  if (kind === 'custom_request') {
    return 'Individuelles Sponsoring';
  }

  return 'Anonyme Unterstützung';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRequestReference(requestId: string) {
  return requestId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default async function EventSponsoringAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ adminSaved?: string; adminError?: string }>;
}) {
  const { eventId } = await params;
  const query = searchParams ? await searchParams : undefined;

  await requireHeadbangAdmin(`/admin/veranstaltungen/${eventId}/sponsoring`);

  const cms = await getCmsContent();
  const event = cms.site.events.find((entry) => entry.id === eventId);

  if (!event) {
    notFound();
  }

  const firebaseReady = hasFirebaseConfig();
  const config = firebaseReady ? await getEventSponsoringConfigByEventId(event.id) : null;
  const packages = firebaseReady ? await listEventSponsoringPackagesByEventId(event.id) : [];
  const banners = firebaseReady ? await listEventSponsoringBannersByEventId(event.id) : [];
  const slots = firebaseReady ? await listEventSponsoringSlotsByEventId(event.id) : [];
  const bookings = firebaseReady ? await listEventSponsoringBookingsByEventId(event.id) : [];
  const requests = firebaseReady ? await listEventSponsoringRequestsByEventId(event.id) : [];
  const draftConfig = buildEventSponsoringConfigDraft(event.id, config);
  const existingKinds = new Set(packages.map((entry) => entry.kind));
  const missingKinds = EVENT_SPONSORING_PACKAGE_KIND_ORDER.filter((kind) => !existingKinds.has(kind));
  const missingBannerCount = Math.max(0, 2 - banners.length);
  const bannersWithoutActiveSlots = banners.filter((banner) => !slots.some((slot) => slot.bannerId === banner.id && slot.active));
  const capacityRows = buildEventSponsoringCapacitySummary(packages, slots, bookings);
  const slotWarnings = getActiveBannerSlotWarnings(packages, slots);
  const bannerSlotsById = new Map(await Promise.all(banners.map(async (banner) => [banner.id, await listEventSponsoringSlotsByBannerId(event.id, banner.id)] as const)));
  const logoUploadsById = new Map(
    await Promise.all(
      requests
        .filter((request) => Boolean(request.logoUploadId))
        .map(async (request) => [request.logoUploadId || '', await getEventSponsoringLogoUploadById(request.logoUploadId || '')] as const),
    ),
  );

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[1.9rem] border border-[color:var(--color-border)]/80 bg-[linear-gradient(180deg,rgba(18,12,9,0.86)_0%,rgba(10,7,5,0.76)_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-accent-soft)]">Veranstaltungs-Sponsoring</p>
              <h1 className="mt-3 text-4xl font-black text-[color:var(--color-foreground)]">{event.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                detailViewMode ist das führende Feld für die zusätzliche Veranstaltungsansicht. standEnabled wird aus Gründen der Rückwärtskompatibilität automatisch nur für den 3D-Fall gespiegelt.
              </p>
            </div>
            <a href="/veranstaltungen" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">
              Zur Veranstaltungsverwaltung
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href={getEventSponsoringHref(event.id)} className="rounded-xl border border-[color:var(--color-accent)]/50 bg-black/15 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">
              Öffentliche Sponsoringseite ansehen
            </a>
          </div>

          {getSavedMessage(query?.adminSaved) ? (
            <div className="mt-6 rounded-2xl border border-green-500/40 bg-green-950/30 px-5 py-4 text-sm text-green-200">
              {getSavedMessage(query?.adminSaved) || ''}
            </div>
          ) : null}

          {query?.adminError ? (
            <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/30 px-5 py-4 text-sm text-red-200">
              {query.adminError}
            </div>
          ) : null}

          {!firebaseReady ? (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">
              Für diese Verwaltung ist eine Firestore-Konfiguration erforderlich. Die Event-Sponsoring-Daten werden absichtlich nicht im CMS-Fallback gespeichert.
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">1. Veranstaltung und Status</p>
            <h2 className="mt-3 text-2xl font-black text-[color:var(--color-foreground)]">{event.festivalName || event.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">Status: {event.status}</p>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">Aktuelle Detailansicht: {resolveEventDetailViewMode(event)}</p>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">Kompatibilitätsfeld standEnabled: {event.standEnabled ? 'true' : 'false'}</p>
          </div>
          <div className="rounded-[1.4rem] border border-[color:var(--color-border)]/70 bg-black/15 p-5 text-sm text-[color:var(--color-muted)]">
            Die oeffentliche Seite verwendet jetzt einen vereinfachten Anfrageablauf ohne Stripe. Banner und Slots dienen hier nur noch der internen Planungsansicht.
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">4. Sponsoringanfragen</p>
            <h2 className="mt-3 text-2xl font-black text-[color:var(--color-foreground)]">Anfragen, Mailstatus und Rechnungsfreigabe</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">Alle oeffentlichen Sponsoringanfragen werden hier gesammelt. Die Bearbeitung und Abrechnung erfolgen manuell per Rechnung.</p>
          </div>

          {!firebaseReady ? (
            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">Anfragen koennen erst angezeigt werden, wenn Firestore konfiguriert ist.</div>
          ) : null}

          {firebaseReady && requests.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[color:var(--color-border)]/70 bg-black/15 px-5 py-4 text-sm text-[color:var(--color-muted)]">Es liegen noch keine Sponsoringanfragen fuer diese Veranstaltung vor.</div>
          ) : null}

          <div className="mt-6 space-y-4">
            {requests.map((request) => (
              <details key={request.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{request.companyName} • {request.packageNameSnapshot}</h3>
                      <p className="mt-1 text-sm text-[color:var(--color-muted)]">{event.festivalName || event.title} • Referenz {formatRequestReference(request.id)} • {request.contactName} • {request.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                      <span className="rounded-full border border-[color:var(--color-border)]/70 bg-black/15 px-3 py-2 text-[color:var(--color-accent-soft)]">{getRequestStatusLabel(request.status)}</span>
                      <span className="rounded-full border border-[color:var(--color-border)]/70 bg-black/15 px-3 py-2 text-[color:var(--color-accent-soft)]">Mail: {getEmailStateLabel(request.emailDelivery.state)}</span>
                    </div>
                  </div>
                </summary>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[color:var(--color-border)]/70 bg-black/15 p-4 text-sm leading-7 text-[color:var(--color-muted)] lg:col-span-2">
                    <p><strong className="text-[color:var(--color-foreground)]">Anfrage-ID:</strong> {request.id}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Referenz:</strong> {formatRequestReference(request.id)}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Eingang:</strong> {formatDateTime(request.createdAt)}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Veranstaltung:</strong> {event.festivalName || event.title}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Paketpreis:</strong> {typeof request.packagePriceCents === 'number' && request.packagePriceCents > 0 ? formatEuroCents(request.packagePriceCents) : 'individuelle Vereinbarung'}</p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[color:var(--color-border)]/70 bg-black/15 p-4 text-sm leading-7 text-[color:var(--color-muted)]">
                    <p><strong className="text-[color:var(--color-foreground)]">Rechnungsadresse:</strong> {request.billingAddress.street} {request.billingAddress.houseNumber}, {request.billingAddress.postalCode} {request.billingAddress.city}, {request.billingAddress.countryCode}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Website:</strong> {request.companyWebsite || 'nicht angegeben'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Oeffentliche Darstellung:</strong> {request.publicDisplayEnabled ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Anonym:</strong> {request.anonymousSupport ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Einwilligung Datenverarbeitung:</strong> {request.acceptDataProcessing ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Rechnung akzeptiert:</strong> {request.acceptInvoicePayment ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Manuelle Logoplatzierung akzeptiert:</strong> {request.acceptManualLogoPlacement ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Logo vorhanden:</strong> {request.logoUploadId ? 'ja' : 'nein'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">E-Mail-Versuche:</strong> {request.emailDelivery.attemptCount}</p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[color:var(--color-border)]/70 bg-black/15 p-4 text-sm leading-7 text-[color:var(--color-muted)]">
                    <p><strong className="text-[color:var(--color-foreground)]">Unterstuetzungsarten:</strong> {request.supportTypes.length > 0 ? request.supportTypes.join(', ') : 'keine'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Leistungen zum Anfragezeitpunkt:</strong> {request.packageFeaturesSnapshot.length > 0 ? request.packageFeaturesSnapshot.join(', ') : 'keine gespeicherten Leistungen'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Nachricht:</strong> {request.message || 'keine weitere Nachricht'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Zuletzt versendet:</strong> {request.emailDelivery.sentAt ? formatDateTime(request.emailDelivery.sentAt) : 'noch nicht'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Provider-Message-ID:</strong> {request.emailDelivery.providerMessageId || 'nicht vorhanden'}</p>
                    <p><strong className="text-[color:var(--color-foreground)]">Letzter Mailfehler:</strong> {request.emailDelivery.lastErrorMessage || 'kein Fehler gespeichert'}</p>
                    {request.logoUploadId && logoUploadsById.get(request.logoUploadId) ? (
                      <p>
                        <strong className="text-[color:var(--color-foreground)]">Logo-Download:</strong>{' '}
                        <a href={`/admin/veranstaltungen/${encodeURIComponent(event.id)}/sponsoring/logo/${encodeURIComponent(request.logoUploadId)}`} className="font-semibold text-[color:var(--color-accent-soft)] hover:text-white">
                          {logoUploadsById.get(request.logoUploadId)?.originalFileName || 'Logo herunterladen'}
                        </a>
                      </p>
                    ) : null}
                  </div>

                  <form action={updateEventSponsoringRequestStatusAction} className="grid gap-3 lg:col-span-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="requestId" value={request.id} />
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Status</span>
                      <select name="status" defaultValue={request.status} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]">
                        <option value="new">Neu</option>
                        <option value="invoice_pending">Rechnung vorbereiten</option>
                        <option value="invoice_sent">Rechnung versendet</option>
                        <option value="accepted">Angenommen</option>
                        <option value="declined">Abgelehnt</option>
                        <option value="archived">Archiviert</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Status speichern</button>
                  </form>

                  {request.emailDelivery.state === 'failed' ? (
                    <form action={retryEventSponsoringRequestEmailAction} className="lg:col-span-2">
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Interne Anfrage-Mail erneut senden</button>
                    </form>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">2. Auswahl der Detailansicht</p>
          <form action={saveEventDetailViewModeAction} className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <input type="hidden" name="eventId" value={event.id} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Welche Zusatzansicht soll diese Veranstaltung später öffnen?</span>
              <select name="detailViewMode" defaultValue={resolveEventDetailViewMode(event)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]">
                <option value="none">Keine Zusatzansicht</option>
                <option value="stand3d">3D-Stand</option>
                <option value="sponsoring2d">Sponsoring 2D vorbereiten</option>
              </select>
            </label>
            <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Auswahl speichern</button>
          </form>
        </section>

        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">3. Sponsoring-Grundkonfiguration</p>
          <form action={saveEventSponsoringConfigAction} className="mt-5 grid gap-4 lg:grid-cols-2">
            <input type="hidden" name="eventId" value={event.id} />
            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
              <input type="checkbox" name="enabled" defaultChecked={draftConfig.enabled} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
              Sponsoring für diese Veranstaltung aktivieren
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Währung</span>
              <select name="currencyCode" defaultValue={draftConfig.currencyCode} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]">
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Öffentlicher Titel</span>
              <input name="publicTitle" defaultValue={draftConfig.publicTitle} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Öffentliche Beschreibung</span>
              <textarea name="publicDescription" defaultValue={draftConfig.publicDescription} rows={5} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
              <input type="checkbox" name="anonymousSupportEnabled" defaultChecked={draftConfig.anonymousSupportEnabled} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
              Anonyme Unterstützung erlauben
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Mindestbetrag anonyme Unterstützung in Euro</span>
              <input name="anonymousMinimumAmountEuro" defaultValue={formatEuroCentsForInput(draftConfig.anonymousMinimumAmountCents)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
              <input type="checkbox" name="customSponsoringEnabled" defaultChecked={draftConfig.customSponsoringEnabled} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
              Individuelles Sponsoring aktivieren
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
              <input type="checkbox" name="showOccupiedLogosPublicly" defaultChecked={draftConfig.showOccupiedLogosPublicly} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
              Belegte Logos später öffentlich anzeigen
            </label>
            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110" disabled={!firebaseReady}>Konfiguration speichern</button>
            </div>
          </form>
        </section>

        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">5. Sponsorenpakete</p>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--color-foreground)]">Veranstaltungsbezogene Pakete</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">Slotgroesse und Bannerberechtigung werden serverseitig aus der Paketart abgeleitet. Eine Onlinezahlung gibt es in diesem Anfragefluss nicht.</p>
            </div>
            {firebaseReady && missingKinds.length > 0 ? (
              <form action={seedEventSponsoringPackagesAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">
                  {packages.length === 0 ? 'Standardpakete anlegen' : 'Fehlende Standardpakete ergänzen'}
                </button>
              </form>
            ) : null}
          </div>

          {!firebaseReady ? (
            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">Pakete können erst verwaltet werden, wenn Firestore konfiguriert ist.</div>
          ) : null}

          {firebaseReady && packages.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[color:var(--color-border)]/70 bg-black/15 px-5 py-4 text-sm text-[color:var(--color-muted)]">
              Für diese Veranstaltung gibt es noch keine Sponsoring-Pakete.
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {packages.map((pkg) => {
              const invariants = getEventSponsoringPackageKindInvariants(pkg.kind);

              return (
                <details key={pkg.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                        <p className="mt-1 text-sm text-[color:var(--color-muted)]">{getPackageKindLabel(pkg.kind)} • {formatEuroCents(pkg.priceCents)} • Sortierung {pkg.sortOrder}</p>
                      </div>
                      <div className="rounded-full border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent-soft)]">
                        {pkg.active ? 'Aktiv' : 'Inaktiv'}
                      </div>
                    </div>
                  </summary>

                  <form action={saveEventSponsoringPackageAction} className="mt-5 grid gap-4 lg:grid-cols-2">
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="packageId" value={pkg.id} />
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Name</span>
                      <input name="name" defaultValue={pkg.name} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Preis in Euro</span>
                      <input name="priceEuro" defaultValue={formatEuroCentsForInput(pkg.priceCents)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block lg:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Beschreibung</span>
                      <textarea name="description" defaultValue={pkg.description} rows={4} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block lg:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Leistungen, eine Zeile pro Eintrag</span>
                      <textarea name="featuresText" defaultValue={pkg.features.join('\n')} rows={5} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-foreground)]">Sortierreihenfolge</span>
                      <input name="sortOrder" defaultValue={String(pkg.sortOrder)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]" />
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
                      <input type="checkbox" name="active" defaultChecked={pkg.active} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                      Paket aktiv
                    </label>
                    <div className="rounded-[1.2rem] border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-4 text-sm text-[color:var(--color-muted)] lg:col-span-2">
                      Slotgroesse: {invariants.logoSlotSize} • Bannerplatzierung: {invariants.grantsBannerPlacement ? 'ja' : 'nein'} • Onlinezahlung: nein
                    </div>
                    <div className="lg:col-span-2 flex justify-end">
                      <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Paket speichern</button>
                    </div>
                  </form>
                </details>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[color:var(--color-surface)]/70 p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">6. Interne Bannerplanung</p>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--color-foreground)]">Visueller Layouteditor für interne Banner- und Slotplanung</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">Jedes Banner bleibt im Seitenverhältnis 2:1. Positionen werden in Prozent bearbeitet und serverseitig normalisiert, validiert und versionsgesichert gespeichert. Diese Planung ist nicht Teil der oeffentlichen Sponsoringseite.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {firebaseReady && missingBannerCount > 0 ? (
                <form action={seedEventSponsoringBannersAction}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Zwei Standardbanner anlegen</button>
                </form>
              ) : null}
              {firebaseReady && banners.length > 0 && bannersWithoutActiveSlots.length > 0 ? (
                <form action={seedEventSponsoringSlotsAction}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <button type="submit" className="rounded-xl border border-[color:var(--color-border)]/70 px-4 py-3 text-sm font-black text-white transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent-soft)]">Standardpositionen anlegen</button>
                </form>
              ) : null}
            </div>
          </div>

          {!firebaseReady ? (
            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">Die Banner- und Layoutverwaltung ist nur mit Firestore verfügbar.</div>
          ) : null}

          {slotWarnings.length > 0 ? (
            <div className="mt-5 space-y-3">
              {slotWarnings.map((warning) => (
                <div key={warning} className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">{warning}</div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/10">
            <table className="min-w-full divide-y divide-white/8 text-sm text-[color:var(--color-foreground)]">
              <thead className="bg-black/20 text-left text-xs uppercase tracking-[0.16em] text-[color:var(--color-accent-soft)]">
                <tr>
                  <th className="px-4 py-3">Größe</th>
                  <th className="px-4 py-3">Aktive Plätze</th>
                  <th className="px-4 py-3">Blockiert</th>
                  <th className="px-4 py-3">Zugewiesen</th>
                  <th className="px-4 py-3">Derzeit verkaufbar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {capacityRows.map((row) => (
                  <tr key={row.size}>
                    <td className="px-4 py-3 capitalize">{row.size}</td>
                    <td className="px-4 py-3">{row.active}</td>
                    <td className="px-4 py-3">{row.blocked}</td>
                    <td className="px-4 py-3">{row.assigned}</td>
                    <td className="px-4 py-3">{row.sellable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {firebaseReady && banners.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[color:var(--color-border)]/70 bg-black/15 px-5 py-4 text-sm text-[color:var(--color-muted)]">Für diese Veranstaltung sind noch keine Banner vorhanden.</div>
          ) : null}

          <div className="mt-6 space-y-6">
            {banners.map((banner) => {
              const bannerSlots = bannerSlotsById.get(banner.id) || [];
              const counts = {
                small: bannerSlots.filter((slot) => slot.packageSize === 'small').length,
                medium: bannerSlots.filter((slot) => slot.packageSize === 'medium').length,
                large: bannerSlots.filter((slot) => slot.packageSize === 'large').length,
                available: bannerSlots.filter((slot) => slot.active && slot.status === 'available').length,
                assigned: bannerSlots.filter((slot) => slot.active && slot.status === 'assigned').length,
                blocked: bannerSlots.filter((slot) => slot.active && slot.status === 'blocked').length,
              };

              return (
                <section key={banner.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{banner.name}</h3>
                      <p className="mt-2 text-sm text-[color:var(--color-muted)]">{banner.widthMm} × {banner.heightMm} mm • Version {banner.layoutVersion} • {banner.active ? 'aktiv' : 'inaktiv'}</p>
                      <p className="mt-2 text-sm text-[color:var(--color-muted)]">Klein: {counts.small} • Mittel: {counts.medium} • Groß: {counts.large} • Verfügbar: {counts.available} • Zugewiesen: {counts.assigned} • Gesperrt: {counts.blocked}</p>
                    </div>
                    <form action={saveEventSponsoringBannerAction} className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto] sm:items-end">
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="bannerId" value={banner.id} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Bannername</span>
                        <input name="name" defaultValue={banner.name} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-white">
                        <input type="checkbox" name="active" defaultChecked={banner.active} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                        Aktiv
                      </label>
                      <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Banner speichern</button>
                    </form>
                  </div>

                  <div className="mt-5">
                    <EventSponsoringBannerEditor eventId={event.id} banner={banner} initialSlots={bannerSlots} saveAction={saveEventSponsoringBannerLayoutAction} />
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
