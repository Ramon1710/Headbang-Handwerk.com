import { listPublicZollhausProducts } from '@/lib/zollhaus/public-catalog';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { zollhausShellStyles as shellStyles } from '@/components/zollhaus/zollhaus-shell';
import { ZollhausCheckoutClient } from '@/components/zollhaus/checkout-client';

export default async function ZollhausCheckoutPage() {
  const [products, settings] = await Promise.all([listPublicZollhausProducts(), getResolvedZollhausShopSettings()]);

  return (
    <section className={shellStyles.panel}>
      <ZollhausCheckoutClient
        products={products}
        settings={{
          checkoutEnabled: settings.checkoutEnabled,
          checkoutShippingNotice: settings.checkoutShippingNotice,
          checkoutInvoiceNotice: settings.checkoutInvoiceNotice,
          checkoutLegalNotice: settings.checkoutLegalNotice,
          checkoutSubmitButtonLabel: settings.checkoutSubmitButtonLabel,
        }}
      />
    </section>
  );
}