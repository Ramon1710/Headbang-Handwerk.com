'use client';

import { useState } from 'react';
import { useZollhausCart } from '@/components/zollhaus/cart-provider';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';
import styles from './cart-ui.module.css';

export function ZollhausAddToCartPanel({ product, compact = false }: { product: PublicZollhausProduct; compact?: boolean }) {
  const { addItem } = useZollhausCart();
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState('');

  const maxStock = Math.max(1, product.stockQuantity);

  function handleAdd() {
    addItem(product.id, quantity, maxStock);
    setAddedMessage('Zum Warenkorb hinzugefügt.');
  }

  return (
    <div className={styles.actionPanel}>
      <div className={styles.quantityRow}>
        <label className={styles.smallText} htmlFor={`zollhaus-qty-${product.id}`}>
          Menge
        </label>
        <div className={styles.quantityControls}>
          <input
            id={`zollhaus-qty-${product.id}`}
            className={styles.quantityInput}
            type="number"
            min={1}
            max={maxStock}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(maxStock, Number(event.target.value) || 1)))}
            disabled={product.isSoldOut}
          />
          <button type="button" className={product.isSoldOut ? styles.disabledButton : styles.primaryButton} onClick={handleAdd} disabled={product.isSoldOut}>
            In den Warenkorb
          </button>
        </div>
      </div>
      <p className={styles.smallText}>{product.isSoldOut ? 'Dieser Artikel ist momentan nicht verfügbar.' : `Derzeit sind bis zu ${product.stockQuantity} Stück verfügbar.`}</p>
      {addedMessage ? <p className={styles.helperText}>{addedMessage}</p> : null}
      {!compact ? <p className={styles.helperText}>Verfügbarkeit und Gesamtpreis werden beim Absenden Ihrer Bestellung noch einmal geprüft.</p> : null}
    </div>
  );
}