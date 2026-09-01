import { Suspense } from 'react';
import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';
import { CheckoutClient } from './checkout-client';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const cms = await getCmsContent();
  const params = searchParams ? await searchParams : undefined;
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';

  return (
    <>
      <SiteNavigation
        links={cms.site.navigationLinks}
        ctaLabel={cms.site.navigationCtaLabel}
        ctaHref={cms.site.navigationCtaHref}
      />
      <Suspense fallback={<div className="body-copy min-h-screen bg-[#0a0a0a] pt-24 flex items-center justify-center">Laden...</div>}>
        <CheckoutClient sponsorPackages={cms.site.sponsorPackages} />
      </Suspense>
      <Footer content={cms.site.footer} isAdmin={isAdmin} liveEditor={cms.site.liveEditor} logoSrc={cms.site.logo.assetUrl} contactEmail={cms.site.contact.email} />
    </>
  );
}
