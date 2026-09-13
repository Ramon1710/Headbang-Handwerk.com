'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useZollhausCart } from '@/components/zollhaus/cart-provider';
import { ZollhausAddToCartPanel } from '@/components/zollhaus/add-to-cart-panel';
import { resolveZollhausNotice } from '@/components/zollhaus/public-copy';
import { ZollhausProductCard } from '@/components/zollhaus/product-card';
import { calculateZollhausCartTotal } from '@/lib/zollhaus/cart';
import { formatPriceCentsForDisplay } from '@/lib/zollhaus/product-admin';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';
import styles from './cart-ui.module.css';

interface ShopClientProps {
  products: PublicZollhausProduct[];
  checkoutEnabled: boolean;
  checkoutInvoiceNotice: string;
  checkoutShippingNotice: string;
}

export function ZollhausShopClient(props: ShopClientProps) {
  const { items, updateQuantity, removeItem, removeUnavailableItems, ready } = useZollhausCart();
  const productMap = useMemo(() => new Map(props.products.map((product) => [product.id, product])), [props.products]);
  const invoiceNotice = resolveZollhausNotice(
    props.checkoutInvoiceNotice,
    'Bestellungen werden im Zollhaus-Shop auf Rechnung entgegengenommen.'
  );
  const shippingNotice = resolveZollhausNotice(
    props.checkoutShippingNotice,
    'Vor dem Absenden wird die Verfügbarkeit aller Artikel noch einmal geprüft.'
  );

  const totalPriceCents = calculateZollhausCartTotal(items, props.products);
  const missingItems = items.filter((item) => !productMap.has(item.productId));

  useEffect(() => {
    if (!ready || !missingItems.length) {
      return;
    }

    removeUnavailableItems(productMap.keys());
  }, [missingItems.length, productMap, ready, removeUnavailableItems]);

  return (
    <div className={styles.layout}>
      <div className={styles.productsColumn}>
        <div className={styles.noticeStack}>
          <div className={styles.warningCard}>
            <div className={styles.checkoutBadge}>Bestellung auf Rechnung</div>
            <p className={styles.muted}>{invoiceNotice}</p>
          </div>
          <div className={styles.warningCard}>
            <p className={styles.muted}>{shippingNotice}</p>
          </div>
        </div>

        {props.products.length ? (
          <section className={styles.cardStack}>
            {props.products.map((product) => (
              <article key={product.id} className={styles.productCardWrap}>
                <ZollhausProductCard product={product} detailHint="Auf der Produktseite findest du weitere Eindrücke und alle wichtigen Details." />
                <ZollhausAddToCartPanel product={product} />
              </article>
            ))}
          </section>
        ) : null}
      </div>

      <aside className={styles.summaryColumn}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.smallText}>Warenkorb</p>
              <h2 className={styles.sectionTitle}>Ihre Auswahl</h2>
            </div>
            <div className={styles.totalValue}>{formatPriceCentsForDisplay(totalPriceCents)}</div>
          </div>

          {!ready ? <p className={styles.smallText}>Warenkorb wird geladen…</p> : null}

          {items.length ? (
            <div className={styles.lineList}>
              {items.map((item) => {
                const product = productMap.get(item.productId);

                if (!product) {
                  return (
                    <div key={item.productId} className={styles.lineCard}>
                      <div className={styles.lineMeta}>
                        <h3 className={styles.lineTitle}>Artikel nicht mehr verfügbar</h3>
                        <p className={styles.smallText}>Bitte aus dem Warenkorb entfernen.</p>
                      </div>
                      <div className={styles.buttonRow}>
                        <button type="button" className={styles.dangerButton} onClick={() => removeItem(item.productId)}>
                          Entfernen
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.productId} className={styles.lineCard}>
                    <div className={styles.lineHeader}>
                      <div className={styles.lineMeta}>
                        <h3 className={styles.lineTitle}>{product.name}</h3>
                        <p className={styles.smallText}>{product.priceLabel} pro Stück</p>
                      </div>
                      <span className={styles.priceValue}>{formatPriceCentsForDisplay(item.quantity * product.priceCents)}</span>
                    </div>
                    <div className={styles.quantityRow}>
                      <input
                        className={styles.quantityInput}
                        type="number"
                        min={0}
                        max={product.stockQuantity}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.productId, Number(event.target.value) || 0, product.stockQuantity)}
                      />
                      <button type="button" className={styles.dangerButton} onClick={() => removeItem(item.productId)}>
                        Entfernen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Noch kein Artikel im Warenkorb. Entdecke zuerst die Produkte im Shop.</p>
            </div>
          )}

          {missingItems.length ? <p className={styles.errorMessage}>Mindestens ein Artikel im Warenkorb ist nicht mehr öffentlich verfügbar und muss entfernt werden.</p> : null}

          <div className={styles.summaryStack}>
            <div className={styles.totalsRow}>
              <span className={styles.smallText}>Zwischensumme</span>
              <span className={styles.priceValue}>{formatPriceCentsForDisplay(totalPriceCents)}</span>
            </div>
            <div className={styles.totalsRow}>
              <span className={styles.smallText}>Gesamtpreis</span>
              <span className={styles.totalValue}>{formatPriceCentsForDisplay(totalPriceCents)}</span>
            </div>
            {items.length && props.checkoutEnabled && !missingItems.length ? (
              <Link href="/zollhaus/bestellen" className={styles.primaryButton}>
                Warenkorb anzeigen und bestellen
              </Link>
            ) : (
              <span className={styles.disabledButton}>{props.checkoutEnabled ? 'Warenkorb zuerst vervollständigen' : 'Checkout derzeit deaktiviert'}</span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}