'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  addZollhausCartItem,
  parseZollhausCart,
  removeZollhausCartItem,
  updateZollhausCartItemQuantity,
  ZOLLHAUS_CART_STORAGE_KEY,
  type ZollhausCartItem,
} from '@/lib/zollhaus/cart';

interface ZollhausCartContextValue {
  items: ZollhausCartItem[];
  ready: boolean;
  addItem: (productId: string, quantity: number, maxStock: number) => void;
  updateQuantity: (productId: string, quantity: number, maxStock: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const ZollhausCartContext = createContext<ZollhausCartContextValue | null>(null);

export function ZollhausCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ZollhausCartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextItems = parseZollhausCart(window.localStorage.getItem(ZOLLHAUS_CART_STORAGE_KEY));
    setItems(nextItems);
    setReady(true);

    function handleStorage(event: StorageEvent) {
      if (event.key !== ZOLLHAUS_CART_STORAGE_KEY) {
        return;
      }

      setItems(parseZollhausCart(event.newValue));
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(ZOLLHAUS_CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  return (
    <ZollhausCartContext.Provider
      value={{
        items,
        ready,
        addItem: (productId, quantity, maxStock) => setItems((current) => addZollhausCartItem(current, productId, quantity, maxStock)),
        updateQuantity: (productId, quantity, maxStock) => setItems((current) => updateZollhausCartItemQuantity(current, productId, quantity, maxStock)),
        removeItem: (productId) => setItems((current) => removeZollhausCartItem(current, productId)),
        clearCart: () => setItems([]),
      }}
    >
      {children}
    </ZollhausCartContext.Provider>
  );
}

export function useZollhausCart() {
  const context = useContext(ZollhausCartContext);

  if (!context) {
    throw new Error('useZollhausCart must be used within ZollhausCartProvider');
  }

  return context;
}