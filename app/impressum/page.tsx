import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml, textParagraphHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'Impressum – Headbang Handwerk' };

export default async function ImpressumPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <LiveResizableBox boxKey="imprint.title.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'imprint.title.box')} isAdmin={isAdmin} className="mb-10 text-center">
            <LiveEditableText as="h1" className="text-4xl font-black text-white" editorKey="imprint.title" initialHtml={resolveLiveHtml(liveEditor, 'imprint.title', 'Impressum')} isAdmin={isAdmin} title="Impressum Titel" />
          </LiveResizableBox>
          <div className="legal-copy content-flow text-gray-300">
            <LiveResizableBox boxKey="imprint.company.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'imprint.company.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="imprint.company.content" initialHtml={resolveLiveRichHtml(liveEditor, 'imprint.company.content', `${textParagraphHtml('Angaben gemäß § 5 TMG', 'text-xl font-bold text-white')}${textParagraphHtml('Headbang Handwerk\n[Vorname Nachname]\n[Straße Nr.]\n[PLZ Ort]', '')}`)} isAdmin={isAdmin} title="Impressum Angaben" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="imprint.contact.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'imprint.contact.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="imprint.contact.content" initialHtml={resolveLiveRichHtml(liveEditor, 'imprint.contact.content', `${textParagraphHtml('Kontakt', 'text-xl font-bold text-white')}${textParagraphHtml('E-Mail: info@headbang-handwerk.com', '')}`)} isAdmin={isAdmin} title="Impressum Kontakt" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="imprint.liability.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'imprint.liability.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="imprint.liability.content" initialHtml={resolveLiveRichHtml(liveEditor, 'imprint.liability.content', `${textParagraphHtml('Haftung für Inhalte', 'text-xl font-bold text-white')}${textParagraphHtml('Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.', '')}`)} isAdmin={isAdmin} title="Impressum Haftung" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="imprint.note.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'imprint.note.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="p" className="text-xs text-gray-500" editorKey="imprint.note" initialHtml={resolveLiveHtml(liveEditor, 'imprint.note', 'Bitte ersetze die Platzhalter [Vorname Nachname], [Straße Nr.] und [PLZ Ort] mit deinen echten Angaben.')} isAdmin={isAdmin} title="Impressum Hinweis" />
            </LiveResizableBox>
          </div>
        </div>
    </EditablePageShell>
  );
}
