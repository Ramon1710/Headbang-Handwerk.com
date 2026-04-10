import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml, resolveLiveRichHtml, textParagraphHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = { title: 'AGB – Headbang Handwerk' };

export default async function AGBPage({
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
          <LiveResizableBox boxKey="terms.title.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'terms.title.box')} isAdmin={isAdmin} className="mb-10 text-center">
            <LiveEditableText as="h1" className="text-4xl font-black text-white" editorKey="terms.title" initialHtml={resolveLiveHtml(liveEditor, 'terms.title', 'Allgemeine Geschäftsbedingungen')} isAdmin={isAdmin} title="AGB Titel" />
          </LiveResizableBox>
          <div className="legal-copy content-flow text-gray-300">
            <LiveResizableBox boxKey="terms.section.0.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'terms.section.0.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="terms.section.0.content" initialHtml={resolveLiveRichHtml(liveEditor, 'terms.section.0.content', `${textParagraphHtml('§ 1 Geltungsbereich', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über die Website headbang-handwerk.com abgeschlossen werden.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="AGB Abschnitt 1" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="terms.section.1.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'terms.section.1.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="terms.section.1.content" initialHtml={resolveLiveRichHtml(liveEditor, 'terms.section.1.content', `${textParagraphHtml('§ 2 Vertragsschluss', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Mit der Buchung eines Sponsoring-Pakets oder einer Bannerfläche kommt ein verbindlicher Vertrag zwischen dem Kunden und Headbang Handwerk zustande.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="AGB Abschnitt 2" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="terms.section.2.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'terms.section.2.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="terms.section.2.content" initialHtml={resolveLiveRichHtml(liveEditor, 'terms.section.2.content', `${textParagraphHtml('§ 3 Zahlung', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Die Zahlung erfolgt per Stripe (Kreditkarte, SEPA). Die Zahlungsabwicklung unterliegt den AGB von Stripe Inc.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="AGB Abschnitt 3" />
            </LiveResizableBox>
            <LiveResizableBox boxKey="terms.section.3.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'terms.section.3.box')} isAdmin={isAdmin} className="content-flow">
              <LiveEditableText as="div" className="content-flow" editorKey="terms.section.3.content" initialHtml={resolveLiveRichHtml(liveEditor, 'terms.section.3.content', `${textParagraphHtml('§ 4 Spendenquittung', 'mb-3 text-xl font-bold text-white')}${textParagraphHtml('Hinweis: Headbang Handwerk ist kein eingetragener gemeinnütziger Verein. Spendenquittungen im steuerrechtlichen Sinne können daher nicht ausgestellt werden. Auf Wunsch wird eine Zahlungsbestätigung ausgestellt.', 'text-sm leading-relaxed')}`)} isAdmin={isAdmin} title="AGB Abschnitt 4" />
            </LiveResizableBox>
          </div>
        </div>
    </EditablePageShell>
  );
}
