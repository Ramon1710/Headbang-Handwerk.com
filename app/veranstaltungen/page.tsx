import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { EventCard } from '@/components/event-card';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { addEventAction, removeEventAction, toggleEventStatusAction, updateEventAction } from './actions';

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
                </div>
                <div className="text-sm font-semibold">
                  {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                  {params?.adminError ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">Aktion fehlgeschlagen. Bitte Pflichtfelder prüfen.</p> : null}
                </div>
              </div>

              <form action={addEventAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
                <input name="title" placeholder="Titel" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="festivalName" placeholder="Festivalname" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="date" placeholder="Datum" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="location" placeholder="Ort" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="ctaText" placeholder="Button Text" defaultValue="Mehr erfahren" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <input name="ctaUrl" placeholder="Button Link" defaultValue="/kontakt" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <select name="status" defaultValue="planned" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]">
                  <option value="planned">Geplant</option>
                  <option value="confirmed">Bestätigt</option>
                  <option value="completed">Abgeschlossen</option>
                </select>
                <input name="id" placeholder="Optionale ID" className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <textarea name="description" rows={4} placeholder="Beschreibung" className="lg:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                <div className="lg:col-span-2 flex justify-end">
                  <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Veranstaltung hinzufügen</button>
                </div>
              </form>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {events.map((event) => (
                  <div key={event.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                    <form action={updateEventAction} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="id" value={event.id} />
                      <input name="title" defaultValue={event.title} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="festivalName" defaultValue={event.festivalName} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="date" defaultValue={event.date} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="location" defaultValue={event.location} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="ctaText" defaultValue={event.ctaText} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <input name="ctaUrl" defaultValue={event.ctaUrl || '/kontakt'} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <select name="status" defaultValue={event.status} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]">
                        <option value="planned">Geplant</option>
                        <option value="confirmed">Bestätigt</option>
                        <option value="completed">Abgeschlossen</option>
                      </select>
                      <div className="rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">ID: {event.id}</div>
                      <textarea name="description" rows={4} defaultValue={event.description} className="md:col-span-2 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                      </div>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <form action={toggleEventStatusAction}>
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-500/25">Auf {event.status === 'confirmed' ? 'Geplant' : 'Bestätigt'} umschalten</button>
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
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              <LiveEditableText as="span" className="inline" editorKey="events.titlePrefix" initialHtml={resolveLiveHtml(liveEditor, 'events.titlePrefix', 'Festival')} isAdmin={isAdmin} title="Veranstaltungen Titel Anfang" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="events.titleHighlight" initialHtml={resolveLiveHtml(liveEditor, 'events.titleHighlight', 'Termine 2025')} isAdmin={isAdmin} title="Veranstaltungen Titel Highlight" />
            </h1>
            <LiveEditableText as="p" className="mx-auto max-w-2xl text-lg text-gray-300" editorKey="events.lead" initialHtml={resolveLiveHtml(liveEditor, 'events.lead', 'Wir sind auf den größten Metal-Festivals Europas vertreten. Hier findet ihr alle aktuellen und geplanten Veranstaltungen.')} isAdmin={isAdmin} title="Veranstaltungen Einleitung" />
          </LiveResizableBox>

          {renderSection('Bestätigt', 'events.confirmedHeading', 'events.confirmedHeading.box', 'bg-green-500', confirmed)}
          {renderSection('Geplant', 'events.plannedHeading', 'events.plannedHeading.box', 'bg-yellow-500', planned)}
          {renderSection('Abgeschlossen', 'events.completedHeading', 'events.completedHeading.box', 'bg-slate-400', completed)}
        </div>
    </EditablePageShell>
  );
}
