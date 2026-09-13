'use client';

import { useState } from 'react';
import styles from './product-admin.module.css';

type PreviewMode = 'desktop' | 'tablet' | 'smartphone';

export function ShopPreviewSwitcher({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PreviewMode>('desktop');

  return (
    <div className={styles.stack}>
      <div className={styles.previewToggleGroup} role="tablist" aria-label="Shopvorschau-Gerät">
        <button
          type="button"
          className={mode === 'desktop' ? styles.previewToggleActive : styles.previewToggle}
          onClick={() => setMode('desktop')}
        >
          Desktop
        </button>
        <button
          type="button"
          className={mode === 'tablet' ? styles.previewToggleActive : styles.previewToggle}
          onClick={() => setMode('tablet')}
        >
          Tablet
        </button>
        <button
          type="button"
          className={mode === 'smartphone' ? styles.previewToggleActive : styles.previewToggle}
          onClick={() => setMode('smartphone')}
        >
          Smartphone
        </button>
      </div>

      <div className={styles.fullPreviewViewport}>
        <div className={styles.fullPreviewScroller}>
          <div
            className={[
              styles.fullPreviewCanvas,
              mode === 'desktop' ? styles.fullPreviewDesktop : '',
              mode === 'tablet' ? styles.fullPreviewTablet : '',
              mode === 'smartphone' ? styles.fullPreviewSmartphone : '',
            ].filter(Boolean).join(' ')}
          >
            <div className={styles.previewBanner}>Vorschau der öffentlichen Shopseite</div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}