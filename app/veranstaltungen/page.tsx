import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { EventCard } from '@/components/event-card';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { events } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Veranstaltungen – Headbang Handwerk',
  description: 'Alle Festival-Termine 2025 von Headbang Handwerk.',
};

export default async function VeranstaltungenPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;
  const confirmed = events.filter((e) => e.status === 'confirmed');
  const planned = events.filter((e) => e.status === 'planned');

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveResizableBox boxKey="events.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'events.intro.box')} isAdmin={isAdmin} className="copy-center content-flow mb-14">
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              <LiveEditableText as="span" className="inline" editorKey="events.titlePrefix" initialHtml={resolveLiveHtml(liveEditor, 'events.titlePrefix', 'Festival')} isAdmin={isAdmin} title="Veranstaltungen Titel Anfang" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="events.titleHighlight" initialHtml={resolveLiveHtml(liveEditor, 'events.titleHighlight', 'Termine 2025')} isAdmin={isAdmin} title="Veranstaltungen Titel Highlight" />
            </h1>
            <LiveEditableText as="p" className="mx-auto max-w-2xl text-lg text-gray-300" editorKey="events.lead" initialHtml={resolveLiveHtml(liveEditor, 'events.lead', 'Wir sind auf den größten Metal-Festivals Europas vertreten. Hier findet ihr alle aktuellen und geplanten Veranstaltungen.')} isAdmin={isAdmin} title="Veranstaltungen Einleitung" />
          </LiveResizableBox>

          {confirmed.length > 0 && (
            <div className="mb-14">
              <LiveResizableBox boxKey="events.confirmedHeading.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'events.confirmedHeading.box')} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <LiveEditableText as="span" className="inline" editorKey="events.confirmedHeading" initialHtml={resolveLiveHtml(liveEditor, 'events.confirmedHeading', 'Bestätigt')} isAdmin={isAdmin} title="Bestätigt Überschrift" />
              </h2>
              </LiveResizableBox>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {confirmed.map((e, index) => (
                  <LiveResizableBox key={e.id} boxKey={`events.confirmed.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `events.confirmed.${index}.box`)} isAdmin={isAdmin} className="h-full">
                    <EventCard event={e} />
                  </LiveResizableBox>
                ))}
              </div>
            </div>
          )}

          {planned.length > 0 && (
            <div>
              <LiveResizableBox boxKey="events.plannedHeading.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'events.plannedHeading.box')} isAdmin={isAdmin} className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <LiveEditableText as="span" className="inline" editorKey="events.plannedHeading" initialHtml={resolveLiveHtml(liveEditor, 'events.plannedHeading', 'Geplant')} isAdmin={isAdmin} title="Geplant Überschrift" />
              </h2>
              </LiveResizableBox>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planned.map((e, index) => (
                  <LiveResizableBox key={e.id} boxKey={`events.planned.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `events.planned.${index}.box`)} isAdmin={isAdmin} className="h-full">
                    <EventCard event={e} />
                  </LiveResizableBox>
                ))}
              </div>
            </div>
          )}
        </div>
    </EditablePageShell>
  );
}
