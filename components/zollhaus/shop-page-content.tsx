import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import shopStyles from '@/components/zollhaus/public-shop.module.css';
import { resolveZollhausNotice } from '@/components/zollhaus/public-copy';
import { ZollhausShopClient } from '@/components/zollhaus/shop-client';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';
import type { ZollhausShopSettings } from '@/lib/zollhaus/types';

interface ZollhausShopPageContentProps {
  products: PublicZollhausProduct[];
  settings: Pick<ZollhausShopSettings, 'checkoutEnabled' | 'checkoutInvoiceNotice' | 'checkoutShippingNotice'>;
}

export function ZollhausShopPageContent({ products, settings }: ZollhausShopPageContentProps) {
  const invoiceNotice = resolveZollhausNotice(
    settings.checkoutInvoiceNotice,
    'Bestellungen werden bequem auf Rechnung entgegengenommen. Alle wichtigen Informationen erhalten Sie im Anschluss.'
  );
  const shippingNotice = resolveZollhausNotice(
    settings.checkoutShippingNotice,
    'Verfügbarkeit und Versand werden beim Absenden Ihrer Bestellung noch einmal sorgfältig geprüft.'
  );

  return (
    <div className={shopStyles.stack}>
      <section className={styles.panel}>
        <div className={shopStyles.heroPanel}>
          <div className={shopStyles.heroMeta}>
            <p className={shopStyles.eyebrow}>Aus dem Zollhaus</p>
            <h2 className={shopStyles.headline}>Zollhaus Shop</h2>
            <p className={shopStyles.intro}>
              Entdecke einzigartige Taschen und weitere besondere Artikel aus dem Zollhaus.
            </p>
          </div>

          <div className={shopStyles.heroStats}>
            <div className={shopStyles.heroStatCard}>
              <span className={shopStyles.heroStatLabel}>Bestellen auf Rechnung</span>
              <span className={shopStyles.heroStatValue}>{invoiceNotice}</span>
            </div>
            <div className={shopStyles.heroStatCard}>
              <span className={shopStyles.heroStatLabel}>Gut zu wissen</span>
              <span className={shopStyles.heroStatValue}>{shippingNotice}</span>
            </div>
          </div>
        </div>
      </section>

      {products.length ? (
        <ZollhausShopClient
          products={products}
          checkoutEnabled={settings.checkoutEnabled}
          checkoutInvoiceNotice={settings.checkoutInvoiceNotice}
          checkoutShippingNotice={settings.checkoutShippingNotice}
        />
      ) : (
        <section className={shopStyles.emptyState}>
          Aktuell sind keine Artikel verfügbar. Schau gerne bald wieder vorbei.
        </section>
      )}
    </div>
  );
}