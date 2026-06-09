import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { Button } from '@/components/ui/button';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';

export const metadata: Metadata = {
  title: 'Partner & Unterstützer – Headbang Handwerk',
};

export default async function PartnerInfoPage({
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <LiveResizableBox boxKey="partnerInfo.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partnerInfo.intro.box')} isAdmin={isAdmin} className="section-shell content-box sm:p-10">
            <LiveEditableText as="h1" className="page-title" editorKey="partnerInfo.title" initialHtml={resolveLiveHtml(liveEditor, 'partnerInfo.title', 'Infos für Partner und Unterstützer')} isAdmin={isAdmin} title="Partnerinfo Titel" normalizeTypography />
            <LiveEditableText as="p" className="body-copy-lg mt-6" editorKey="partnerInfo.lead" initialHtml={resolveLiveHtml(liveEditor, 'partnerInfo.lead', 'Hier könnt ihr alle relevanten Informationen für Partner, Unterstützer und interessierte Betriebe direkt in der Admin-Ansicht pflegen.')} isAdmin={isAdmin} title="Partnerinfo Lead" normalizeTypography />
          </LiveResizableBox>

          <LiveResizableBox boxKey="partnerInfo.side.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partnerInfo.side.box')} isAdmin={isAdmin} className="section-shell content-box">
            <LiveEditableText as="h2" className="section-title" editorKey="partnerInfo.sideTitle" initialHtml={resolveLiveHtml(liveEditor, 'partnerInfo.sideTitle', 'Direkte Einstiege')} isAdmin={isAdmin} title="Partnerinfo Seitentitel" normalizeTypography />
            <div className="mt-6 grid gap-4">
              <Button href="/formular" className="w-full justify-center">Zum Formular</Button>
              <Button href="/sponsoren" variant="secondary" className="w-full justify-center">Zu den Sponsorenpaketen</Button>
              <Button href="/kontakt" variant="secondary" className="w-full justify-center">Kontakt aufnehmen</Button>
            </div>
          </LiveResizableBox>
        </div>

        <LiveResizableBox boxKey="partnerInfo.body.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partnerInfo.body.box')} isAdmin={isAdmin} className="section-shell content-box mt-8 sm:p-10">
          <LiveEditableText as="div" className="body-copy-lg space-y-5" editorKey="partnerInfo.body" initialHtml={resolveLiveHtml(liveEditor, 'partnerInfo.body', 'Pflegt hier Hinweise für Partner, Unterstützer, Leistungen, Gegenleistungen und den Ablauf der Zusammenarbeit.')} isAdmin={isAdmin} title="Partnerinfo Inhalt" normalizeTypography />
        </LiveResizableBox>
      </div>
    </EditablePageShell>
  );
}