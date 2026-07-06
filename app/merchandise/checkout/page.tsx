import { SiteNavigation } from '@/components/site-navigation';
import { Footer } from '@/components/footer';
import { getCmsContent } from '@/lib/cms/storage';
import { MerchandiseCheckoutClient } from './checkout-client';

export default async function MerchandiseCheckoutPage() {
  const cms = await getCmsContent();

  return (
    <>
      <SiteNavigation links={cms.site.navigationLinks} ctaLabel={cms.site.navigationCtaLabel} ctaHref={cms.site.navigationCtaHref} />
      <MerchandiseCheckoutClient products={cms.site.merchandise.products} />
      <Footer content={cms.site.footer} />
    </>
  );
}