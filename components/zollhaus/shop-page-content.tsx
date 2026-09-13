import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import shopStyles from '@/components/zollhaus/public-shop.module.css';
import { ZollhausShopClient } from '@/components/zollhaus/shop-client';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';
import type { ZollhausShopSettings } from '@/lib/zollhaus/types';

interface ZollhausShopPageContentProps {
  products: PublicZollhausProduct[];
  settings: Pick<ZollhausShopSettings, 'checkoutEnabled' | 'checkoutInvoiceNotice' | 'checkoutShippingNotice'>;
}

export function ZollhausShopPageContent({ products, settings }: ZollhausShopPageContentProps) {
  const soldOutCount = products.filter((product) => product.isSoldOut).length;

  return (
    <div className={shopStyles.stack}>
      <section className={styles.panel}>
        <div className={shopStyles.heroPanel}>
          <div className={shopStyles.heroMeta}>
            <p className={shopStyles.eyebrow}>Zollhaus Leer</p>
            <h2 className={shopStyles.headline}>Zollhaus Shop</h2>
            <p className={shopStyles.intro}>
              Eine eigenständige, modern aufgebaute Produktfläche für den Zollhausverein Leer. Gezeigt werden ausschließlich aktuell veröffentlichte Artikel aus der getrennten Zollhaus-Datenbasis.
            </p>
          </div>

          <div className={shopStyles.heroStats}>
            <div className={shopStyles.heroStatCard}>
              <span className={shopStyles.heroStatLabel}>Aktive Produkte</span>
              <span className={shopStyles.heroStatValue}>{products.length}</span>
            </div>
            <div className={shopStyles.heroStatCard}>
              <span className={shopStyles.heroStatLabel}>Aktuell ausverkauft</span>
              <span className={shopStyles.heroStatValue}>{soldOutCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelBody}>
          <p>Der Zollhaus-Shop arbeitet hier ausschließlich mit Warenkorb und Bestellung auf Rechnung. Preise, Verfügbarkeit und Gesamtbetrag werden erst beim Bestellen serverseitig verbindlich bestätigt.</p>
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
          Derzeit sind noch keine öffentlichen Produkte freigeschaltet. Neue Artikel erscheinen hier automatisch, sobald sie im Zollhaus-Admin aktiviert wurden.
        </section>
      )}
    </div>
  );
}