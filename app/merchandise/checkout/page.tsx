import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent } from '@/lib/cms/storage';
import { MerchandiseCheckoutClient } from './checkout-client';

export default async function MerchandiseCheckoutPage({
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
      <SiteNavigation links={cms.site.navigationLinks} ctaLabel={cms.site.navigationCtaLabel} ctaHref={cms.site.navigationCtaHref} />
      <MerchandiseCheckoutClient products={cms.site.merchandise.products} />
      <Footer content={cms.site.footer} isAdmin={isAdmin} liveEditor={cms.site.liveEditor} logoSrc={cms.site.logo.assetUrl} contactEmail={cms.site.contact.email} />
    </>
  );
}