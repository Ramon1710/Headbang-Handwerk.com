import { Suspense } from 'react';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { getCmsContent } from '@/lib/cms/storage';
import { CheckoutClient } from './checkout-client';

export default async function CheckoutPage() {
  const cms = await getCmsContent();

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] pt-24 flex items-center justify-center text-gray-400">Laden...</div>}>
        <CheckoutClient sponsorPackages={cms.site.sponsorPackages} />
      </Suspense>
      <Footer content={cms.site.footer} />
    </>
  );
}
