'use client';

import { useState } from 'react';
import styles from './public-shop.module.css';
import type { PublicZollhausProductImage } from '@/lib/zollhaus/public-products';

export function ZollhausProductGallery({ images, productName }: { images: PublicZollhausProductImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0] || null;

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryHero}>
        {activeImage ? (
          <img src={activeImage.url} alt={activeImage.alt} className={styles.galleryHeroImage} />
        ) : (
          <div className={styles.galleryPlaceholder}>Für {productName} ist aktuell noch kein Bild veröffentlicht.</div>
        )}
      </div>

      {images.length > 1 ? (
        <div className={styles.galleryThumbGrid}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={index === activeIndex ? styles.galleryThumbActive : styles.galleryThumb}
              onClick={() => setActiveIndex(index)}
              aria-label={`Bild ${index + 1} von ${images.length} anzeigen`}
            >
              <img src={image.url} alt={image.alt} className={styles.galleryThumbImage} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
