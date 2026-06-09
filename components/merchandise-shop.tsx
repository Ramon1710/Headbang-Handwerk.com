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
          <article key={product.id} className="section-shell content-box">
            {product.imageUrl ? (
              <div className="mb-6 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20">
                <img src={product.imageUrl} alt={product.name} className="h-64 w-full object-cover" />
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                {product.badge ? (
                  <p className="body-copy text-sm font-semibold uppercase tracking-[0.24em]">{product.badge}</p>
                ) : null}
                <h2 className="section-title mt-3 text-[2rem]">{product.name}</h2>
              </div>
              <div className="body-copy rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-black">
                {formatPrice(product.price)}
              </div>
            </div>

            <p className="body-copy mt-4 text-sm">{product.description}</p>

            <div className="mt-6 space-y-4">
              {product.sizes?.length ? (
                <label className="block">
                  <span className="body-copy mb-2 block text-sm font-semibold">Größe</span>
                  <select
                    value={selection?.size || ''}
                    onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], size: event.target.value } }))}
                    className="body-copy w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
                  >
                    {product.sizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {product.colors?.length ? (
                <label className="block">
                  <span className="body-copy mb-2 block text-sm font-semibold">Farbe</span>
                  <select
                    value={selection?.color || ''}
                    onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], color: event.target.value } }))}
                    className="body-copy w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
                  >
                    {product.colors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="body-copy mb-2 block text-sm font-semibold">Anzahl</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={selection?.quantity || 1}
                  onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], quantity: Math.max(1, Number(event.target.value) || 1) } }))}
                  className="body-copy w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
                />
              </label>

              <label className="block">
                <span className="body-copy mb-2 block text-sm font-semibold">E-Mail für Bestätigung</span>
                <input
                  type="email"
                  value={selection?.email || ''}
                  onChange={(event) => setSelectedOptions((current) => ({ ...current, [product.id]: { ...current[product.id], email: event.target.value } }))}
                  placeholder="dein.name@example.com"
                  className="body-copy w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
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