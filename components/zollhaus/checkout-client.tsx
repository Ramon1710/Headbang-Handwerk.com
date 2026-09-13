'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { calculateZollhausCartTotal, clearZollhausCartAfterSuccess } from '@/lib/zollhaus/cart';
import { resolveZollhausNotice } from '@/components/zollhaus/public-copy';
import { formatPriceCentsForDisplay } from '@/lib/zollhaus/product-admin';
import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';
import { useZollhausCart } from '@/components/zollhaus/cart-provider';
import styles from './cart-ui.module.css';

interface CheckoutClientProps {
  products: PublicZollhausProduct[];
  settings: {
    checkoutEnabled: boolean;
    checkoutShippingNotice: string;
    checkoutInvoiceNotice: string;
    checkoutLegalNotice: string;
    checkoutSubmitButtonLabel: string;
  };
}

const initialCustomer = {
  firstName: '',
  lastName: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  email: '',
  phone: '',
};

export function ZollhausCheckoutClient({ products, settings }: CheckoutClientProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, removeUnavailableItems, clearCart, ready } = useZollhausCart();
  const [customer, setCustomer] = useState(initialCustomer);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
      return;
    }

    setIdempotencyKey(`zollhaus-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);
  }, []);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const invoiceNotice = resolveZollhausNotice(
    settings.checkoutInvoiceNotice,
    'Bestellungen werden bequem auf Rechnung entgegengenommen.'
  );
  const shippingNotice = resolveZollhausNotice(
    settings.checkoutShippingNotice,
    'Verfügbarkeit und Versand werden nach dem Absenden noch einmal geprüft.'
  );
  const legalNotice = resolveZollhausNotice(
    settings.checkoutLegalNotice,
    'Mit dem Absenden geben Sie eine verbindliche Bestellung auf Rechnung ab.'
  );
  const missingItems = items.filter((item) => !productMap.has(item.productId));
  const totalPriceCents = calculateZollhausCartTotal(items, products);

  useEffect(() => {
    if (!ready || !missingItems.length) {
      return;
    }

    removeUnavailableItems(productMap.keys());
  }, [missingItems.length, productMap, ready, removeUnavailableItems]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!settings.checkoutEnabled || !items.length || missingItems.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/zollhaus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          customer,
          items,
          website: honeypot,
        }),
      });

      const payload = await response.json().catch(() => ({ error: 'Die Bestellung konnte nicht verarbeitet werden.' }));

      if (!response.ok || !payload?.confirmationToken) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Die Bestellung konnte nicht verarbeitet werden.');
      }

      clearCart();
      const nextItems = clearZollhausCartAfterSuccess(true, items);

      if (nextItems.length !== 0) {
        throw new Error('Der Warenkorb konnte nach erfolgreicher Bestellung nicht geleert werden.');
      }

      router.push(`/zollhaus/danke?token=${encodeURIComponent(payload.confirmationToken)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Die Bestellung konnte nicht verarbeitet werden.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.checkoutGrid}>
      <section className={styles.formCard}>
        <div className={styles.noticeStack}>
          <div className={styles.checkoutBadge}>Bestellung auf Rechnung</div>
          <h2 className={styles.sectionTitle}>Rechnungsdaten und Bestellung prüfen</h2>
          <p className={styles.muted}>{invoiceNotice}</p>
          <p className={styles.muted}>{shippingNotice}</p>
          <p className={styles.muted}>{legalNotice}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.summaryStack}>
          <div className={styles.fieldGrid}>
            {[
              ['firstName', 'Vorname'],
              ['lastName', 'Nachname'],
              ['street', 'Straße'],
              ['houseNumber', 'Hausnummer'],
              ['postalCode', 'Postleitzahl'],
              ['city', 'Ort'],
              ['email', 'E-Mail-Adresse'],
              ['phone', 'Telefonnummer'],
            ].map(([field, label]) => (
              <label key={field} className={field === 'email' || field === 'phone' ? styles.fieldSpan : undefined}>
                <span className={styles.fieldLabel}>{label}</span>
                <input
                  className={styles.textInput}
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={customer[field as keyof typeof customer]}
                  maxLength={field === 'houseNumber' ? 40 : field === 'postalCode' ? 20 : field === 'email' ? 320 : field === 'phone' ? 60 : 160}
                  onChange={(event) => setCustomer((current) => ({ ...current, [field]: event.target.value }))}
                  required
                />
              </label>
            ))}
          </div>

          <label className={styles.hiddenField} htmlFor="zollhaus-company-field">
            Website
          </label>
          <input id="zollhaus-company-field" className={styles.hiddenField} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} autoComplete="off" tabIndex={-1} />

          {errorMessage ? <div className={styles.errorMessage}>{errorMessage}</div> : null}

          <div className={styles.buttonRow}>
            <button type="submit" className={settings.checkoutEnabled && items.length && !missingItems.length && !isSubmitting ? styles.primaryButton : styles.disabledButton} disabled={!settings.checkoutEnabled || !items.length || Boolean(missingItems.length) || isSubmitting || !ready}>
              {isSubmitting ? 'Bestellung wird gespeichert…' : settings.checkoutSubmitButtonLabel}
            </button>
            <Link href="/zollhaus" className={styles.secondaryButton}>Zurück zum Shop</Link>
          </div>
        </form>
      </section>

      <aside className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <p className={styles.smallText}>Bestellübersicht</p>
            <h2 className={styles.sectionTitle}>Warenkorb</h2>
          </div>
          <div className={styles.totalValue}>{formatPriceCentsForDisplay(totalPriceCents)}</div>
        </div>

        {items.length ? (
          <div className={styles.lineList}>
            {items.map((item) => {
              const product = productMap.get(item.productId);

              if (!product) {
                return (
                  <div key={item.productId} className={styles.lineCard}>
                    <div className={styles.lineMeta}>
                      <h3 className={styles.lineTitle}>Artikel nicht mehr verfügbar</h3>
                      <p className={styles.smallText}>Bitte entfernen oder zurück zum Shop gehen.</p>
                    </div>
                    <button type="button" className={styles.dangerButton} onClick={() => removeItem(item.productId)}>Entfernen</button>
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
                    <div className={styles.priceValue}>{formatPriceCentsForDisplay(item.quantity * product.priceCents)}</div>
                  </div>
                  <div className={styles.quantityRow}>
                    <input className={styles.quantityInput} type="number" min={0} max={product.stockQuantity} value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value) || 0, product.stockQuantity)} />
                    <button type="button" className={styles.dangerButton} onClick={() => removeItem(item.productId)}>Entfernen</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Ihr Warenkorb ist leer. Wählen Sie zuerst Artikel im Zollhaus-Shop aus.</p>
            <Link href="/zollhaus" className={styles.secondaryButton}>Zum Zollhaus-Shop</Link>
          </div>
        )}

        <div className={styles.summaryStack}>
          <div className={styles.totalsRow}>
            <span className={styles.smallText}>Zwischensumme</span>
            <span className={styles.priceValue}>{formatPriceCentsForDisplay(totalPriceCents)}</span>
          </div>
          <div className={styles.totalsRow}>
            <span className={styles.smallText}>Gesamtpreis</span>
            <span className={styles.totalValue}>{formatPriceCentsForDisplay(totalPriceCents)}</span>
          </div>
          {missingItems.length ? <div className={styles.errorMessage}>Nicht mehr verfügbare Artikel müssen vor dem Absenden entfernt werden.</div> : null}
        </div>
      </aside>
    </div>
  );
}