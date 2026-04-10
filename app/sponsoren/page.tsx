import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { SponsorPackageCard } from '@/components/sponsor-package-card';
import { Button } from '@/components/ui/button';
import { getCmsContent } from '@/lib/cms/storage';
import { sponsorPackages } from '@/lib/data';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sponsoren – Headbang Handwerk',
  description: 'Sponsoring-Pakete für Headbang Handwerk. Sichert euch eure Sichtbarkeit auf unseren Festivals.',
};

export default async function SponsorenPage() {
  const cms = await getCmsContent();
  const sponsors = cms.site.sponsors;

  return (
    <>
      <Navigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <main className="min-h-screen bg-transparent pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="content-flow text-center mb-14 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              {sponsors.title}{' '}
              <span className="text-[color:var(--color-accent)]">{sponsors.accentWord}</span>
            </h1>
            <p className="text-gray-400 text-lg">
              {sponsors.lead}
            </p>
          </div>

          <div className="section-shell p-8 mb-14 text-center">
            <h2 className="text-white font-bold text-xl mb-6">{sponsors.benefitsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.benefits.map((b) => (
                <div key={b} className="flex items-start justify-center gap-3 text-center">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
                  <span className="text-gray-300 text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
            {sponsorPackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>

          <div className="section-shell content-flow text-center p-8">
            <h3 className="text-white font-bold text-xl">{sponsors.customPackageTitle}</h3>
            <p className="text-gray-300 text-sm max-w-lg mx-auto">
              {sponsors.customPackageText}
            </p>
            <Button href={sponsors.customPackageCtaHref} size="md">
              {sponsors.customPackageCtaLabel}
            </Button>
          </div>
        </div>
      </main>
      <Footer content={cms.site.footer} />
    </>
  );
}
