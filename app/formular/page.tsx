import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
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
        <LiveResizableBox boxKey="formPage.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'formPage.intro.box')} isAdmin={isAdmin} className="section-shell p-8 text-center sm:p-10 lg:p-12">
          <LiveEditableText as="h1" className="text-4xl font-black text-white sm:text-5xl" editorKey="formPage.title" initialHtml={resolveLiveHtml(liveEditor, 'formPage.title', 'Mitglied werden / Formular')} isAdmin={isAdmin} title="Formular Titel" normalizeTypography />
          <LiveEditableText as="p" className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[color:var(--color-muted)]" editorKey="formPage.lead" initialHtml={resolveLiveHtml(liveEditor, 'formPage.lead', 'Hier könnt ihr euer gewünschtes Formular oder den direkten Erstkontakt für Mitgliedschaften und Anfragen einfügen.')} isAdmin={isAdmin} title="Formular Einleitung" normalizeTypography />
        </LiveResizableBox>

        <LiveResizableBox boxKey="formPage.form.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'formPage.form.box')} isAdmin={isAdmin} className="section-shell mt-8 p-8">
          <LiveEditableText as="h2" className="mb-6 text-center text-2xl font-black text-white" editorKey="formPage.formTitle" initialHtml={resolveLiveHtml(liveEditor, 'formPage.formTitle', 'Kontaktformular')} isAdmin={isAdmin} title="Formular Überschrift" normalizeTypography />
          <ContactForm />
        </LiveResizableBox>
      </div>
    </EditablePageShell>
  );
}