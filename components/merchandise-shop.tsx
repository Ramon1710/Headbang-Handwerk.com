'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { MerchandiseProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';

interface MerchandiseShopProps {
  products: MerchandiseProduct[];
}

export function MerchandiseShop({ products }: MerchandiseShopProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { size?: string; color?: string; quantity: number; email: string }>>(
    Object.fromEntries(
      products.map((product) => [
        product.id,
        {
          size: product.sizes?.[0],
          color: product.colors?.[0],
          quantity: 1,
          email: '',
        },
      ])
    )
  );
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  async function handleCheckout(product: MerchandiseProduct) {
    const selection = selectedOptions[product.id];
    setLoadingProductId(product.id);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'merchandise',
          productId: product.id,
          size: selection?.size,
          color: selection?.color,
          quantity: selection?.quantity || 1,
          email: selection?.email || '',
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
      setLoadingProductId(null);
    }
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-3">
      {products.map((product) => {
        const selection = selectedOptions[product.id];
        const isLoading = loadingProductId === product.id;

        return (
          <article key={product.id} className="section-shell p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                {product.badge ? (
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent-soft)]">{product.badge}</p>
                ) : null}
                <h2 className="mt-3 text-2xl font-black text-white">{product.name}</h2>
              </div>
              <div className="rounded-full border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/12 px-4 py-2 text-sm font-black text-[color:var(--color-accent-soft)]">
                {formatPrice(product.price)}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)]">{product.description}</p>

            <div className="mt-6 space-y-4">
              {product.sizes?.length ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Größe</span>
                  <select
                    value={selection?.size || ''}
                    onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], size: event.target.value } }))}
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]"
                  >
                    {product.sizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {product.colors?.length ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Farbe</span>
                  <select
                    value={selection?.color || ''}
                    onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], color: event.target.value } }))}
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]"
                  >
                    {product.colors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Anzahl</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={selection?.quantity || 1}
                  onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], quantity: Math.max(1, Number(event.target.value) || 1) } }))}
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">E-Mail für Bestätigung</span>
                <input
                  type="email"
                  value={selection?.email || ''}
                  onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], email: event.target.value } }))}
                  placeholder="dein.name@example.com"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]"
                />
              </label>
            </div>

            <Button onClick={() => handleCheckout(product)} size="lg" className="mt-7 w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Weiterleitung zu Stripe...</>
              ) : (
                `Jetzt kaufen – ${formatPrice(product.price * (selection?.quantity || 1))}`
              )}
            </Button>
          </article>
        );
      })}
    </div>
  );
}