import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: 'Formular – Headbang Handwerk',
};

export default async function FormularPage({
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <LiveResizableBox boxKey="formPage.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'formPage.intro.box')} isAdmin={isAdmin} className="section-shell content-box text-center sm:p-10 lg:p-12">
          <LiveEditableText as="h1" className="page-title" editorKey="formPage.title" initialHtml={resolveLiveHtml(liveEditor, 'formPage.title', 'Mitglied werden / Formular')} isAdmin={isAdmin} title="Formular Titel" normalizeTypography />
          <LiveEditableText as="p" className="body-copy-lg mx-auto mt-6 max-w-3xl" editorKey="formPage.lead" initialHtml={resolveLiveHtml(liveEditor, 'formPage.lead', 'Hier könnt ihr euer gewünschtes Formular oder den direkten Erstkontakt für Mitgliedschaften und Anfragen einfügen.')} isAdmin={isAdmin} title="Formular Einleitung" normalizeTypography />
        </LiveResizableBox>

        <LiveResizableBox boxKey="formPage.form.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'formPage.form.box')} isAdmin={isAdmin} className="section-shell content-box mt-8">
          <LiveEditableText as="h2" className="section-title mb-6 text-center" editorKey="formPage.formTitle" initialHtml={resolveLiveHtml(liveEditor, 'formPage.formTitle', 'Kontaktformular')} isAdmin={isAdmin} title="Formular Überschrift" normalizeTypography />
          <div className="mx-auto w-full max-w-[824px] overflow-hidden rounded-[1.4rem] border border-[color:var(--color-border)] bg-black/10">
            <iframe
              src="https://formular.vereinsplaner.com/embed/0ea97d8f-0446-4a9c-b172-2042aa012f2c"
              title="Mitglied werden Formular"
              className="block w-full border-0"
              style={{ height: '1200px' }}
            />
          </div>
        </LiveResizableBox>
      </div>
    </EditablePageShell>
  );
}