'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { MerchandiseCartItem, MerchandiseProduct } from '@/lib/types';
import { calculateCartTotal, formatVariantLabel, getCartItemKey, MERCHANDISE_CART_STORAGE_KEY, MERCHANDISE_SUPPORT_TEXT } from '@/lib/merchandise';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';

interface MerchandiseShopProps {
  products: MerchandiseProduct[];
}

export function MerchandiseShop({ products }: MerchandiseShopProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { size?: string; color?: string; quantity: number }>>(
    Object.fromEntries(
      products.map((product) => [
        product.id,
        {
          size: product.sizes?.[0],
          color: product.colors?.[0],
          quantity: 1,
        },
      ])
    )
  );
  const [cartItems, setCartItems] = useState<MerchandiseCartItem[]>([]);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(MERCHANDISE_CART_STORAGE_KEY);
      if (!storedCart) {
        return;
      }

      const parsed = JSON.parse(storedCart);
      if (!Array.isArray(parsed)) {
        return;
      }

      setCartItems(parsed);
    } catch {
      window.localStorage.removeItem(MERCHANDISE_CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MERCHANDISE_CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function handleAddToCart(product: MerchandiseProduct) {
    const selection = selectedOptions[product.id];
    const nextItem: MerchandiseCartItem = {
      productId: product.id,
      quantity: Math.max(1, selection?.quantity || 1),
      size: selection?.size,
      color: selection?.color,
    };

    setCartItems((current) => {
      const existingIndex = current.findIndex((item) => getCartItemKey(item) === getCartItemKey(nextItem));

      if (existingIndex < 0) {
        return [...current, nextItem];
      }

      return current.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: Math.min(10, item.quantity + nextItem.quantity) }
          : item
      );
    });
  }

  function updateCartQuantity(itemKey: string, quantity: number) {
    setCartItems((current) =>
      current
        .map((item) => (getCartItemKey(item) === itemKey ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(itemKey: string) {
    setCartItems((current) => current.filter((item) => getCartItemKey(item) !== itemKey));
  }

  const cartTotal = calculateCartTotal(cartItems, products);

  return (
    <div className="mt-12 space-y-10">
      <section className="rounded-[1.6rem] border border-[color:var(--color-border)]/80 bg-black/20 p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="body-copy text-sm font-semibold uppercase tracking-[0.24em]">Warenkorb</p>
            <h2 className="section-title mt-3 text-[1.9rem]">Artikel sammeln und gesammelt zur Kasse gehen</h2>
            <p className="body-copy mt-3 max-w-3xl text-sm">{MERCHANDISE_SUPPORT_TEXT}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[color:var(--color-border)] bg-black/20 px-5 py-4 text-left lg:min-w-72">
            <p className="body-copy text-xs uppercase tracking-[0.2em]">Zwischensumme</p>
            <p className="mt-2 text-3xl font-black text-white">{formatPrice(cartTotal)}</p>
            <p className="body-copy mt-2 text-sm">{cartItems.length} Positionen im Warenkorb</p>
              {cartItems.length > 0 ? (
                <Button href="/merchandise/checkout" size="lg" className="mt-5 w-full">Zur Kasse</Button>
              ) : (
                <Button size="lg" className="mt-5 w-full" disabled>Zur Kasse</Button>
              )}
          </div>
        </div>

        {cartItems.length ? (
          <div className="mt-6 space-y-3">
            {cartItems.map((item) => {
              const product = products.find((entry) => entry.id === item.productId);
              if (!product) {
                return null;
              }

              const itemKey = getCartItemKey(item);
              const variantLabel = formatVariantLabel(item);

              return (
                <div key={itemKey} className="flex flex-col gap-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">{product.name}</h3>
                    <p className="body-copy mt-1 text-sm">{variantLabel || 'Standardausführung'}</p>
                    {product.estimatedDeliveryTime ? <p className="body-copy mt-1 text-sm">Lieferzeit: {product.estimatedDeliveryTime}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-full border border-[color:var(--color-border)] bg-black/20">
                      <button type="button" onClick={() => updateCartQuantity(itemKey, item.quantity - 1)} className="px-3 py-2 text-[color:var(--color-accent-soft)] transition hover:text-white" aria-label="Menge reduzieren">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-black text-white">{item.quantity}</span>
                      <button type="button" onClick={() => updateCartQuantity(itemKey, item.quantity + 1)} className="px-3 py-2 text-[color:var(--color-accent-soft)] transition hover:text-white" aria-label="Menge erhöhen">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[color:var(--color-muted)]">{formatPrice(product.price)} pro Stück</p>
                      <p className="text-lg font-black text-white">{formatPrice(product.price * item.quantity)}</p>
                    </div>
                    <button type="button" onClick={() => removeCartItem(itemKey)} className="rounded-full border border-red-500/30 p-3 text-red-200 transition hover:bg-red-500/10" aria-label="Artikel entfernen">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.2rem] border border-dashed border-[color:var(--color-border)] px-5 py-6 text-left">
            <p className="body-copy text-sm">Ihr Warenkorb ist noch leer. Legen Sie unten Ihre gewünschten Artikel hinein und gehen Sie danach gesammelt zur Kasse.</p>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {products.map((product) => {
          const selection = selectedOptions[product.id];

          return (
            <article key={product.id} className="section-shell content-box text-left">
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
              {product.estimatedDeliveryTime ? <p className="body-copy mt-3 text-sm font-semibold">Voraussichtliche Lieferzeit: {product.estimatedDeliveryTime}</p> : null}

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
              </div>

              <Button onClick={() => handleAddToCart(product)} size="lg" className="mt-7 w-full">
                <ShoppingCart className="h-4 w-4" /> In den Warenkorb – {formatPrice(product.price * (selection?.quantity || 1))}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}