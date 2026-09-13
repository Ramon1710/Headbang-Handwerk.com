'use client';

import { useState } from 'react';
import styles from './product-admin.module.css';
import { ZollhausProductCard } from '@/components/zollhaus/product-card';
import { toPublicZollhausProduct } from '@/lib/zollhaus/public-products';
import type { ZollhausProduct } from '@/lib/zollhaus/types';

export function ProductPreviewSwitcher({ product }: { product: ZollhausProduct }) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const previewProduct = toPublicZollhausProduct(product);

  return (
    <div className={styles.stack}>
      <div className={styles.previewToggleGroup} role="tablist" aria-label="Produktkartenvorschau">
        <button
          type="button"
          className={mode === 'desktop' ? styles.previewToggleActive : styles.previewToggle}
          onClick={() => setMode('desktop')}
        >
          Desktop
        </button>
        <button
          type="button"
          className={mode === 'mobile' ? styles.previewToggleActive : styles.previewToggle}
          onClick={() => setMode('mobile')}
        >
          Mobil
        </button>
      </div>

      <div className={styles.previewStage}>
        <div className={mode === 'mobile' ? styles.previewMobile : styles.previewDesktop}>
          <ZollhausProductCard product={previewProduct} linkToDetail={false} />
        </div>
      </div>
    </div>
  );
}
