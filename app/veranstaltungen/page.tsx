import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { EventCard } from '@/components/event-card';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getUpcomingEvents } from '@/lib/events';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { getEventStandHref } from '@/lib/site';
import { serializeBannerSlots } from '@/lib/event-stand';
import { addEventAction, removeEventAction, toggleEventStandAction, toggleEventStatusAction, updateEventAction } from './actions';

export const metadata: Metadata = {
  title: 'Veranstaltungen – Headbang Handwerk',
  description: 'Alle Festival-Termine 2025 von Headbang Handwerk.',
};

export default async function VeranstaltungenPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;
  const events = cms.site.events;
  const confirmed = events.filter((e) => e.status === 'confirmed');
  const planned = events.filter((e) => e.status === 'planned');
  const completed = events.filter((e) => e.status === 'completed');
  const cancelled = events.filter((e) => e.status === 'cancelled');
  const upcomingEvents = getUpcomingEvents(events);

  function getAdminErrorMessage(adminError?: string) {
    if (!adminError) {
      return null;
    }

    return decodeURIComponent(adminError);
  }

  function renderSection(title: string, editorKey: string, boxKey: string, dotClassName: string, items: typeof events) {
    if (!items.length) {
      return null;
    }

    return (
      <div className="mb-14">
        <LiveResizableBox boxKey={boxKey} initialStyle={resolveLiveBoxStyle(liveEditor, boxKey)} isAdmin={isAdmin} className="mb-6">
          <h2 className="flex items-center justify-center gap-3 text-2xl font-bold text-white">
            <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
            <LiveEditableText as="span" className="inline" editorKey={editorKey} initialHtml={resolveLiveHtml(liveEditor, editorKey, title)} isAdmin={isAdmin} title={`${title} Überschrift`} />
          </h2>
        </LiveResizableBox>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((event) => (
            <LiveResizableBox key={event.id} boxKey={`events.card.${event.id}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `events.card.${event.id}.box`)} isAdmin={isAdmin} className="h-full">
              <EventCard event={event} isAdmin={isAdmin} liveEditor={liveEditor} editorKeyPrefix={`events.cards.${event.id}`} />
            </LiveResizableBox>
          ))}
        </div>
      </div>
    );
  }

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isAdmin ? (
            <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Veranstaltungen hinzufügen, entfernen und umschalten</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">Änderungen werden direkt ins CMS gespeichert. Der Status-Schalter wechselt zwischen Geplant und Bestätigt.</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">Nur Veranstaltungen mit strukturiertem Startdatum erscheinen später automatisch in der Startseiten-Vorschau.</p>
                </div>
                <div className="text-sm font-semibold">
                  {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                  {getAdminErrorMessage(params?.adminError) ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{getAdminErrorMessage(params?.adminError)}</p> : null}
                </div>
              </div>

              <form action={addEventAction} encType="multipart/form-data" className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
                <input name="title" placeholder="Titel" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="festivalName" placeholder="Festivalname" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="date" placeholder="Datum" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="location" placeholder="Ort" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Startdatum</span>
                  <input name="startDate" type="date" required className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Enddatum optional</span>
                  <input name="endDate" type="date" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <input name="ctaText" placeholder="Button Text" defaultValue="Mehr erfahren" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="ctaUrl" placeholder="Button Link" defaultValue="/kontakt" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="imageUrl" placeholder="Bild-URL optional" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="imageAlt" placeholder="Alternativtext fuer das Bild" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <label className="block lg:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-white">Veranstaltungsbild hochladen</span>
                  <input type="file" name="imageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]" />
                  <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Erlaubt sind PNG, JPG oder WEBP bis 3,5 MB. Ohne strukturiertes Startdatum erscheint die Veranstaltung spaeter nicht automatisch auf der Startseite.</span>
                </label>
                <input name="standAssetUrl" placeholder="3D-Stand Datei URL" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="standAssetName" placeholder="3D-Stand Dateiname" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="standAssetContentType" placeholder="3D-Stand Content-Type, z.B. image/png" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-white">
                  <input type="checkbox" name="standEnabled" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                  3D-Stand beim Klick auf diese Veranstaltung aktivieren
                </label>
                <select name="status" defaultValue="planned" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]">
                  <option value="planned">Geplant</option>
                  <option value="confirmed">Bestätigt</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="cancelled">Abgesagt</option>
                </select>
                <input name="id" placeholder="Optionale ID" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <textarea name="standLead" rows={3} placeholder="Optionaler Event-spezifischer Stand-Lead" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <textarea name="description" rows={4} placeholder="Beschreibung" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <textarea name="standBannerSlots" rows={6} placeholder="Banner-Slots, eine Zeile pro Slot: Name | Position | Größe | Preis | Sichtbarkeit | available/reserved/sold | Beschreibung" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <div className="lg:col-span-2 flex justify-end">
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Veranstaltung hinzufügen</button>
                </div>
              </form>

              {upcomingEvents.length ? (
                <div className="mt-5 rounded-[1.2rem] border border-emerald-500/20 bg-emerald-950/20 px-4 py-4 text-sm text-emerald-100">
                  Automatisch vorschaufähig sind aktuell {upcomingEvents.length} Veranstaltung{upcomingEvents.length === 1 ? '' : 'en'} mit gueltigem strukturiertem Datum.
                </div>
              ) : (
                <div className="mt-5 rounded-[1.2rem] border border-amber-500/20 bg-amber-950/20 px-4 py-4 text-sm text-amber-100">
                  Aktuell ist keine Veranstaltung fuer die spaetere automatische Startseiten-Vorschau qualifiziert.
                </div>
              )}

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {events.map((event) => (
                  <div key={event.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                    <form action={updateEventAction} encType="multipart/form-data" className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="id" value={event.id} />
                      {!event.startDate ? (
                        <div className="md:col-span-2 rounded-xl border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
                          Dieser bestehende Eintrag hat noch kein strukturiertes Startdatum. Er bleibt sichtbar, erscheint spaeter aber nicht automatisch auf der Startseite.
                        </div>
                      ) : null}
                      <input name="title" defaultValue={event.title} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="festivalName" defaultValue={event.festivalName} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="date" defaultValue={event.date} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="location" defaultValue={event.location} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Startdatum</span>
                        <input name="startDate" type="date" defaultValue={event.startDate || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Enddatum optional</span>
                        <input name="endDate" type="date" defaultValue={event.endDate || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <input name="ctaText" defaultValue={event.ctaText} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="ctaUrl" defaultValue={event.ctaUrl || '/kontakt'} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="imageUrl" defaultValue={event.imageUrl || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" placeholder="Bild-URL optional" />
                      <input name="imageAlt" defaultValue={event.imageAlt || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" placeholder="Alternativtext fuer das Bild" />
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-white">Neues Veranstaltungsbild hochladen</span>
                        <input type="file" name="imageFile" accept=".png,.jpg,.jpeg,.webp" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]" />
                        <span className="mt-2 block text-xs text-[color:var(--color-muted)]">Upload ersetzt die Bild-URL. Erlaubt sind PNG, JPG oder WEBP bis 3,5 MB.</span>
                      </label>
                      <label className="inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)] md:col-span-2">
                        <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                        Vorhandenes Veranstaltungsbild entfernen
                      </label>
                      {event.imageUrl ? (
                        <div className="md:col-span-2 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-4 text-sm text-[color:var(--color-muted)]">
                          Aktuell ist bereits ein Veranstaltungsbild hinterlegt.
                        </div>
                      ) : null}
                      <input name="standAssetUrl" defaultValue={event.stand?.assetUrl || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="standAssetName" defaultValue={event.stand?.assetName || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="standAssetContentType" defaultValue={event.stand?.assetContentType || ''} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-white">
                        <input type="checkbox" name="standEnabled" defaultChecked={Boolean(event.standEnabled)} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                        3D-Stand beim Klick auf diese Veranstaltung aktivieren
                      </label>
                      <select name="status" defaultValue={event.status} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]">
                        <option value="planned">Geplant</option>
                        <option value="confirmed">Bestätigt</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="cancelled">Abgesagt</option>
                      </select>
                      {event.standEnabled ? (
                        <a href={getEventStandHref(event.id)} className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-white">Stand öffnen: {event.id}</a>
                      ) : (
                        <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">3D-Stand aktuell deaktiviert</div>
                      )}
                      <textarea name="description" rows={4} defaultValue={event.description} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <textarea name="standLead" rows={3} defaultValue={event.stand?.lead || ''} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <textarea name="standBannerSlots" rows={6} defaultValue={serializeBannerSlots(event.stand?.bannerSlots || [])} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                      </div>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {event.status === 'planned' || event.status === 'confirmed' ? (
                        <form action={toggleEventStatusAction}>
                          <input type="hidden" name="id" value={event.id} />
                          <button type="submit" className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-500/25">Auf {event.status === 'confirmed' ? 'Geplant' : 'Bestätigt'} umschalten</button>
                        </form>
                      ) : (
                        <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">Statuswechsel per Schnellschalter nur fuer geplant und bestaetigt</div>
                      )}
                      <form action={toggleEventStandAction}>
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="rounded-xl bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-200 transition hover:bg-sky-500/25">3D-Stand {event.standEnabled ? 'deaktivieren' : 'aktivieren'}</button>
                      </form>
                      <form action={removeEventAction}>
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Entfernen</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <LiveResizableBox boxKey="events.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'events.intro.box')} isAdmin={isAdmin} className="copy-center content-flow mb-14">
            <h1 className="page-title">
              <LiveEditableText as="span" className="inline" editorKey="events.titlePrefix" initialHtml={resolveLiveHtml(liveEditor, 'events.titlePrefix', 'Festival')} isAdmin={isAdmin} title="Veranstaltungen Titel Anfang" />{' '}
              <LiveEditableText as="span" className="inline" editorKey="events.titleHighlight" initialHtml={resolveLiveHtml(liveEditor, 'events.titleHighlight', 'Termine 2025')} isAdmin={isAdmin} title="Veranstaltungen Titel Highlight" />
            </h1>
            <LiveEditableText as="p" className="body-copy-lg mx-auto max-w-2xl" editorKey="events.lead" initialHtml={resolveLiveHtml(liveEditor, 'events.lead', 'Wir sind auf den größten Metal-Festivals Europas vertreten. Hier findet ihr alle aktuellen und geplanten Veranstaltungen.')} isAdmin={isAdmin} title="Veranstaltungen Einleitung" />
          </LiveResizableBox>

          {renderSection('Bestätigt', 'events.confirmedHeading', 'events.confirmedHeading.box', 'bg-green-500', confirmed)}
          {renderSection('Geplant', 'events.plannedHeading', 'events.plannedHeading.box', 'bg-yellow-500', planned)}
          {renderSection('Abgesagt', 'events.cancelledHeading', 'events.cancelledHeading.box', 'bg-red-500', cancelled)}
          {renderSection('Abgeschlossen', 'events.completedHeading', 'events.completedHeading.box', 'bg-slate-400', completed)}
        </div>
    </EditablePageShell>
  );
}
