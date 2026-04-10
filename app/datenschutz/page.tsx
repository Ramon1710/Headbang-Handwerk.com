import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml, textParagraphHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'Datenschutz – Headbang Handwerk' };

export default async function DatenschutzPage({
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
          <LiveResizableBox boxKey="privacy.title.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'privacy.title.box')} isAdmin={isAdmin} className="mb-10 text-center">
            <LiveEditableText as="h1" className="text-4xl font-black text-white" editorKey="privacy.title" initialHtml={resolveLiveHtml(liveEditor, 'privacy.title', 'Datenschutzerklärung')} isAdmin={isAdmin} title="Datenschutz Titel" />
          </LiveResizableBox>
          <div className="legal-copy content-flow text-gray-300">
            <LiveResizableBox boxKey="privacy.section.0.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'privacy.section.0.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="privacy.section.0.content" initialHtml={resolveLiveRichHtml(liveEditor, 'privacy.section.0.content', `${textParagraphHtml('1. Datenschutz auf einen Blick', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="Datenschutz Abschnitt 1" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="privacy.section.1.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'privacy.section.1.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="privacy.section.1.content" initialHtml={resolveLiveRichHtml(liveEditor, 'privacy.section.1.content', `${textParagraphHtml('2. Datenerfassung auf dieser Website', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Wir erheben Daten, die Sie uns aktiv mitteilen (z.B. über das Kontaktformular). Diese werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="Datenschutz Abschnitt 2" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="privacy.section.2.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'privacy.section.2.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="privacy.section.2.content" initialHtml={resolveLiveRichHtml(liveEditor, 'privacy.section.2.content', `${textParagraphHtml('3. Hosting', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Diese Website wird bei Vercel Inc. gehostet. Details entnehmen Sie der Datenschutzerklärung von Vercel: https://vercel.com/legal/privacy-policy', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="Datenschutz Abschnitt 3" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="privacy.section.3.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'privacy.section.3.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="privacy.section.3.content" initialHtml={resolveLiveRichHtml(liveEditor, 'privacy.section.3.content', `${textParagraphHtml('4. Kontakt', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Bei Fragen zum Datenschutz wenden Sie sich bitte an: info@headbang-handwerk.com', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="Datenschutz Abschnitt 4" />
            </LiveResizableBox>
          </div>
        </div>
    </EditablePageShell>
  );
}
