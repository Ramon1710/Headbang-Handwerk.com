import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { Mail, Instagram, Facebook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kontakt – Headbang Handwerk',
};

export default async function KontaktPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const contact = cms.site.contact;
  const liveEditor = cms.site.liveEditor;
  const instagramLink = cms.site.footer.socialLinks.find((item) => item.platform === 'instagram')?.href || '#';
  const facebookLink = cms.site.footer.socialLinks.find((item) => item.platform === 'facebook')?.href || '#';

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <LiveResizableBox boxKey="contact.info.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'contact.info.box')} isAdmin={isAdmin} className="lg:col-span-1 content-flow text-center text-panel text-panel-roomy h-fit">
              <h1 className="text-4xl font-black text-white">
                <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="contact.title" initialHtml={resolveLiveHtml(liveEditor, 'contact.title', contact.title)} isAdmin={isAdmin} title="Kontakt Titel" />
              </h1>
              <LiveEditableText as="p" className="mx-auto max-w-md leading-relaxed text-gray-300" editorKey="contact.lead" initialHtml={resolveLiveHtml(liveEditor, 'contact.lead', contact.lead)} isAdmin={isAdmin} title="Kontakt Einleitung" />

              <div className="space-y-4 max-w-sm mx-auto">
                <LiveResizableBox boxKey="contact.email.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'contact.email.box')} isAdmin={isAdmin} className="max-w-sm mx-auto">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  {contact.email}
                </a>
                </LiveResizableBox>
                <LiveResizableBox boxKey="contact.instagram.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'contact.instagram.box')} isAdmin={isAdmin} className="max-w-sm mx-auto">
                <a
                  href={instagramLink}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  <LiveEditableText as="span" className="inline" editorKey="contact.instagramLabel" initialHtml={resolveLiveHtml(liveEditor, 'contact.instagramLabel', contact.instagramLabel)} isAdmin={isAdmin} title="Kontakt Instagram Label" />
                </a>
                </LiveResizableBox>
                <LiveResizableBox boxKey="contact.facebook.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'contact.facebook.box')} isAdmin={isAdmin} className="max-w-sm mx-auto">
                <a
                  href={facebookLink}
                  className="flex items-center justify-center gap-3 text-gray-300 transition-colors hover:text-[color:var(--color-accent-soft)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[linear-gradient(180deg,rgba(38,26,19,0.92)_0%,rgba(18,12,8,0.72)_100%)] ring-1 ring-white/8 flex items-center justify-center">
                    <Facebook className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  <LiveEditableText as="span" className="inline" editorKey="contact.facebookLabel" initialHtml={resolveLiveHtml(liveEditor, 'contact.facebookLabel', contact.facebookLabel)} isAdmin={isAdmin} title="Kontakt Facebook Label" />
                </a>
                </LiveResizableBox>
              </div>
            </LiveResizableBox>

            <div className="lg:col-span-2">
              <LiveResizableBox boxKey="contact.form.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'contact.form.box')} isAdmin={isAdmin} className="section-shell p-8">
                <LiveEditableText as="h2" className="mb-6 text-center text-xl font-bold text-white" editorKey="contact.formTitle" initialHtml={resolveLiveHtml(liveEditor, 'contact.formTitle', contact.formTitle)} isAdmin={isAdmin} title="Kontakt Formular Titel" />
                <ContactForm />
              </LiveResizableBox>
            </div>
          </div>
        </div>
    </EditablePageShell>
  );
}
