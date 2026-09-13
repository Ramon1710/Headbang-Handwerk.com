import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicZollhausProductById } from '@/lib/zollhaus/public-catalog';
import { getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import { ZollhausAddToCartPanel } from '@/components/zollhaus/add-to-cart-panel';
import { zollhausShellStyles as shellStyles } from '@/components/zollhaus/zollhaus-shell';
import shopStyles from '@/components/zollhaus/public-shop.module.css';
import cardStyles from '@/components/zollhaus/product-card.module.css';
import { ZollhausProductGallery } from '@/components/zollhaus/product-gallery';

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicZollhausProductById(productId);

  if (!product) {
    return {
      title: 'Produkt nicht gefunden | Zollhaus Shop',
    };
  }

  return {
    title: `${product.name} | Zollhaus Shop`,
    description: product.shortDescription,
  };
}

export default async function ZollhausProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const [product, settings] = await Promise.all([getPublicZollhausProductById(productId), getResolvedZollhausShopSettings()]);

  if (!product) {
    notFound();
  }

  return (
    <div className={shopStyles.stack}>
      <section className={shellStyles.panel}>
        <div className={shopStyles.detailLayout}>
          <div className={shopStyles.stack}>
            <Link href="/zollhaus" className={shopStyles.detailBackLink}>
              <span aria-hidden="true">←</span>
              Zurück zum Zollhaus-Shop
            </Link>

            <div className={shopStyles.detailHeader}>
              <p className={shopStyles.eyebrow}>Zollhaus Leer</p>
              <h2 className={shopStyles.detailTitle}>{product.name}</h2>
              <div className={shopStyles.detailStatusRow}>
                <span className={product.isSoldOut ? cardStyles.badgeSoldOut : cardStyles.badgeActive}>
                  {product.isSoldOut ? 'Ausverkauft' : 'Verfügbar'}
                </span>
                <span className={cardStyles.badgeSubtle}>{product.availabilityLabel}</span>
              </div>
            </div>

            <ZollhausProductGallery images={product.images} productName={product.name} />
          </div>

          <aside className={shopStyles.detailMetaCard}>
            <div className={shellStyles.panel}>
              <div className={shopStyles.detailInfoGrid}>
                <div className={shopStyles.detailInfoCard}>
                  <span className={shopStyles.detailInfoTitle}>Preis</span>
                  <span className={shopStyles.detailInfoValue}>{product.priceLabel}</span>
                </div>
                <div className={shopStyles.detailInfoCard}>
                  <span className={shopStyles.detailInfoTitle}>Verfügbarkeit</span>
                  <span className={shopStyles.detailInfoValue}>{product.availabilityLabel}</span>
                </div>
              </div>

              <div className={shellStyles.panelBody}>
                <p className={shopStyles.detailDescription}>{product.description}</p>
              </div>

              <ZollhausAddToCartPanel product={product} compact />
            </div>

            <div className={shopStyles.noticePanel}>
              {settings.checkoutInvoiceNotice}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
