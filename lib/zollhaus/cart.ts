import type { PublicZollhausProduct } from '@/lib/zollhaus/public-products';

export const ZOLLHAUS_CART_STORAGE_KEY = 'zollhaus-shop-cart-v1';

export interface ZollhausCartItem {
  productId: string;
  quantity: number;
}

function clampQuantity(quantity: number, maxQuantity: number) {
  return Math.max(1, Math.min(quantity, Math.max(1, maxQuantity)));
}

export function parseZollhausCart(input: string | null | undefined) {
  if (!input) {
    return [] as ZollhausCartItem[];
  }

  try {
    const parsed = JSON.parse(input);

    if (!Array.isArray(parsed)) {
      return [] as ZollhausCartItem[];
    }

    return parsed
      .map((entry) => ({
        productId: String(entry?.productId || '').trim(),
        quantity: Number(entry?.quantity || 0),
      }))
      .filter((entry) => /^[A-Za-z0-9_-]{1,120}$/.test(entry.productId) && Number.isInteger(entry.quantity) && entry.quantity > 0);
  } catch {
    return [] as ZollhausCartItem[];
  }
}

export function addZollhausCartItem(items: ZollhausCartItem[], productId: string, quantity: number, maxStock: number) {
  const normalizedQuantity = clampQuantity(quantity, maxStock);
  const existing = items.find((item) => item.productId === productId);

  if (!existing) {
    return [...items, { productId, quantity: normalizedQuantity }];
  }

  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: clampQuantity(item.quantity + normalizedQuantity, maxStock) }
      : item,
  );
}

export function updateZollhausCartItemQuantity(items: ZollhausCartItem[], productId: string, quantity: number, maxStock: number) {
  if (quantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: clampQuantity(quantity, maxStock) }
      : item,
  );
}

export function removeZollhausCartItem(items: ZollhausCartItem[], productId: string) {
  return items.filter((item) => item.productId !== productId);
}

export function removeUnavailableZollhausCartItems(items: ZollhausCartItem[], availableProductIds: Iterable<string>) {
  const available = new Set(availableProductIds);
  return items.filter((item) => available.has(item.productId));
}

export function calculateZollhausCartTotal(items: ZollhausCartItem[], products: PublicZollhausProduct[]) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  return items.reduce((sum, item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      return sum;
    }

    return sum + product.priceCents * item.quantity;
  }, 0);
}

export function clearZollhausCartAfterSuccess(success: boolean, items: ZollhausCartItem[]) {
  return success ? [] : items;
}