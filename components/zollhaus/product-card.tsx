import Link from 'next/link';
import styles from './product-card.module.css';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';

interface ZollhausProductCardProps {
  product: PublicZollhausProduct;
  showFullDescription?: boolean;
  linkToDetail?: boolean;
  detailHint?: string;
}

function CardBody({
  product,
  showFullDescription,
  detailHint,
}: Pick<ZollhausProductCardProps, 'product' | 'showFullDescription' | 'detailHint'>) {
  const primaryImage = product.images[0];

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <div className={styles.badgeRow}>
          <span className={product.isSoldOut ? styles.badgeSoldOut : styles.badgeActive}>{product.isSoldOut ? 'Ausverkauft' : 'Verfügbar'}</span>
          <span className={styles.badgeSubtle}>{product.availabilityLabel}</span>
        </div>
        {primaryImage ? <img src={primaryImage.url} alt={primaryImage.alt} className={styles.image} /> : <div className={styles.placeholder}>Produktbild folgt</div>}
      </div>

      <div className={styles.body}>
        <div>
          <h3 className={styles.title}>{product.name}</h3>
          <p className={styles.description}>{showFullDescription ? product.description : product.shortDescription}</p>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaTitle}>Preis</span>
            <span className={styles.metaValue}>{product.priceLabel}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaTitle}>Verfügbarkeit</span>
            <span className={styles.metaValue}>{product.availabilityLabel}</span>
          </div>
        </div>

        {product.images.length > 1 ? (
          <div className={styles.thumbnailRow}>
            {product.images.slice(0, 4).map((image) => (
              <div key={image.id} className={styles.thumbnail}>
                <img src={image.url} alt={image.alt} />
              </div>
            ))}
          </div>
        ) : null}

        <p className={styles.notice}>{detailHint || 'Jetzt entdecken und bei Gefallen direkt in den Warenkorb legen.'}</p>
      </div>
    </article>
  );
}

export function ZollhausProductCard({ product, showFullDescription = false, linkToDetail = true, detailHint }: ZollhausProductCardProps) {
  if (!linkToDetail) {
    return (
      <div className={styles.cardStatic}>
        <CardBody product={product} showFullDescription={showFullDescription} detailHint={detailHint} />
      </div>
    );
  }

  return (
    <Link href={product.href} className={styles.cardLink}>
      <CardBody product={product} showFullDescription={showFullDescription} detailHint={detailHint} />
    </Link>
  );
}
