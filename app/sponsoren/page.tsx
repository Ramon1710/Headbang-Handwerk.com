import type { Metadata } from 'next';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { SponsorPackageCard } from '@/components/sponsor-package-card';
import { Button } from '@/components/ui/button';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import { getCmsContent } from '@/lib/cms/storage';
import { sponsorPackages } from '@/lib/data';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sponsoren – Headbang Handwerk',
  description: 'Sponsoring-Pakete für Headbang Handwerk. Sichert euch eure Sichtbarkeit auf unseren Festivals.',
};

export default async function SponsorenPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const sponsors = cms.site.sponsors;
  const liveEditor = cms.site.liveEditor;

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveResizableBox boxKey="sponsors.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.intro.box')} isAdmin={isAdmin} className="content-flow text-center mb-14 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              <LiveEditableText as="span" className="inline" editorKey="sponsors.title" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.title', sponsors.title)} isAdmin={isAdmin} title="Sponsoren Titel" />{' '}
              <LiveEditableText as="span" className="inline text-[color:var(--color-accent)]" editorKey="sponsors.accentWord" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.accentWord', sponsors.accentWord)} isAdmin={isAdmin} title="Sponsoren Hervorhebung" />
            </h1>
            <LiveEditableText as="p" className="text-lg text-gray-400" editorKey="sponsors.lead" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.lead', sponsors.lead)} isAdmin={isAdmin} title="Sponsoren Einleitung" />
          </LiveResizableBox>

          <LiveResizableBox boxKey="sponsors.benefits.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.benefits.box')} isAdmin={isAdmin} className="section-shell p-8 mb-14 text-center">
            <LiveEditableText as="h2" className="mb-6 text-xl font-bold text-white" editorKey="sponsors.benefitsTitle" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.benefitsTitle', sponsors.benefitsTitle)} isAdmin={isAdmin} title="Sponsoren Vorteile Titel" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.benefits.map((b, index) => (
                <LiveResizableBox key={b} boxKey={`sponsors.benefits.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `sponsors.benefits.${index}.box`)} isAdmin={isAdmin} className="flex items-start justify-center gap-3 text-center">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
                  <LiveEditableText as="span" className="text-sm text-gray-300" editorKey={`sponsors.benefits.${index}`} initialHtml={resolveLiveHtml(liveEditor, `sponsors.benefits.${index}`, b)} isAdmin={isAdmin} title={`Sponsoren Vorteil ${index + 1}`} />
                </LiveResizableBox>
              ))}
            </div>
          </LiveResizableBox>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
            {sponsorPackages.map((pkg, index) => (
              <LiveResizableBox key={pkg.id} boxKey={`sponsors.packages.${index}.box`} initialStyle={resolveLiveBoxStyle(liveEditor, `sponsors.packages.${index}.box`)} isAdmin={isAdmin} className="h-full">
                <SponsorPackageCard pkg={pkg} />
              </LiveResizableBox>
            ))}
          </div>

          <LiveResizableBox boxKey="sponsors.custom.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'sponsors.custom.box')} isAdmin={isAdmin} className="section-shell content-flow text-center p-8">
            <LiveEditableText as="h3" className="text-xl font-bold text-white" editorKey="sponsors.customPackageTitle" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageTitle', sponsors.customPackageTitle)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket Titel" />
            <LiveEditableText as="p" className="mx-auto max-w-lg text-sm text-gray-300" editorKey="sponsors.customPackageText" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageText', sponsors.customPackageText)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket Text" />
            <Button href={sponsors.customPackageCtaHref} size="md">
              <LiveEditableText as="span" className="inline" editorKey="sponsors.customPackageCtaLabel" initialHtml={resolveLiveHtml(liveEditor, 'sponsors.customPackageCtaLabel', sponsors.customPackageCtaLabel)} isAdmin={isAdmin} title="Sponsoren Individuelles Paket CTA" />
            </Button>
          </LiveResizableBox>
        </div>
    </EditablePageShell>
  );
}
