'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateCartTotal, formatVariantLabel, getCartItemKey, MERCHANDISE_CART_STORAGE_KEY, MERCHANDISE_SUPPORT_TEXT, validateCheckoutCustomer } from '@/lib/merchandise';
import type { MerchandiseCartItem, MerchandiseCheckoutCustomer, MerchandiseProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface MerchandiseCheckoutClientProps {
  products: MerchandiseProduct[];
}

const initialCustomer: MerchandiseCheckoutCustomer = {
  firstName: '',
  lastName: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
};

export function MerchandiseCheckoutClient({ products }: MerchandiseCheckoutClientProps) {
  const [cartItems, setCartItems] = useState<MerchandiseCartItem[]>([]);
  const [customer, setCustomer] = useState<MerchandiseCheckoutCustomer>(initialCustomer);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(MERCHANDISE_CART_STORAGE_KEY);
      if (!storedCart) {
        return;
      }

      const parsed = JSON.parse(storedCart);
      if (Array.isArray(parsed)) {
        setCartItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(MERCHANDISE_CART_STORAGE_KEY);
    }
  }, []);

  const enrichedItems = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) {
            return null;
          }

          return { item, product };
        })
        .filter(Boolean) as Array<{ item: MerchandiseCartItem; product: MerchandiseProduct }>,
    [cartItems, products]
  );

  const total = calculateCartTotal(cartItems, products);

  async function handleCheckout() {
    if (cartItems.length === 0) {
      alert('Ihr Warenkorb ist leer.');
      return;
    }

    const validation = validateCheckoutCustomer(customer);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'merchandise',
          items: cartItems,
          customer: validation.customer,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(data.error || 'checkout-failed');
    } catch {
      alert('Checkout konnte nicht gestartet werden. Bitte später erneut versuchen oder direkt Kontakt aufnehmen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent pt-28 pb-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="section-shell content-box text-left">
          <p className="body-copy text-sm font-semibold uppercase tracking-[0.24em]">Kasse</p>
          <h1 className="page-title mt-4 text-[2.8rem]">Rechnungsdaten und Bestellung prüfen</h1>
          <p className="body-copy-lg mt-5 max-w-3xl">Bitte tragen Sie hier alle Rechnungsdaten ein. Anschließend leiten wir Sie zu Stripe weiter, wo Sie mit Kreditkarte sowie - sofern in Stripe aktiviert - PayPal, Apple Pay oder Google Pay bezahlen können.</p>
          <p className="body-copy mt-5 rounded-[1.2rem] border border-[color:var(--color-border)]/80 bg-black/20 px-5 py-4 text-sm">{MERCHANDISE_SUPPORT_TEXT}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ['firstName', 'Vorname'],
              ['lastName', 'Nachname'],
              ['street', 'Straße'],
              ['houseNumber', 'Hausnummer'],
              ['postalCode', 'Postleitzahl'],
              ['city', 'Ort'],
              ['phone', 'Telefonnummer'],
              ['email', 'E-Mail-Adresse'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="body-copy mb-2 block text-sm font-semibold">{label}</span>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={customer[field as keyof MerchandiseCheckoutCustomer]}
                  onChange={(event) => setCustomer((current) => ({ ...current, [field]: event.target.value }))}
                  className="body-copy w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
                />
              </label>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleCheckout} size="lg" className="sm:flex-1" disabled={loading || cartItems.length === 0}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Weiterleitung zu Stripe...</> : 'Kostenpflichtig bestellen'}
            </Button>
            <Button href="/merchandise" variant="secondary" size="lg" className="sm:flex-1">Zurück zum Shop</Button>
          </div>
        </section>

        <aside className="section-shell content-box h-fit text-left">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="body-copy text-sm font-semibold uppercase tracking-[0.24em]">Bestellübersicht</p>
              <h2 className="section-title mt-3 text-[2rem]">Ihr Warenkorb</h2>
            </div>
            <p className="text-2xl font-black text-white">{formatPrice(total)}</p>
          </div>

          {enrichedItems.length ? (
            <div className="mt-6 space-y-4">
              {enrichedItems.map(({ item, product }) => {
                const variantLabel = formatVariantLabel(item);

                return (
                  <div key={getCartItemKey(item)} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white">{product.name}</h3>
                        <p className="body-copy mt-1 text-sm">Menge: {item.quantity}</p>
                        {variantLabel ? <p className="body-copy mt-1 text-sm">{variantLabel}</p> : null}
                        {product.estimatedDeliveryTime ? <p className="body-copy mt-1 text-sm">Lieferzeit: {product.estimatedDeliveryTime}</p> : null}
                      </div>
                      <p className="text-lg font-black text-white">{formatPrice(product.price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.2rem] border border-dashed border-[color:var(--color-border)] px-5 py-6">
              <p className="body-copy text-sm">Ihr Warenkorb ist leer. Wählen Sie zuerst im Shop Ihre Artikel aus.</p>
              <Button href="/merchandise" size="lg" className="mt-4 w-full">Zum Merchandise-Shop</Button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}