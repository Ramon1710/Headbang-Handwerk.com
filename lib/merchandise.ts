import type { MerchandiseCartItem, MerchandiseCheckoutCustomer, MerchandiseProduct } from '@/lib/types';

export const MERCHANDISE_SUPPORT_TEXT =
  'Unsere Merchandise-Artikel werden zum Selbstkostenpreis zzgl. eines Vereinsanteils angeboten. Mit diesem Vereinsanteil unterstützen Sie die gemeinnützige Arbeit von Headbang Handwerk und helfen dabei, neue Projekte zur Nachwuchsgewinnung und Sichtbarkeit des Handwerks zu realisieren.';

export const MERCHANDISE_CART_STORAGE_KEY = 'headbang-handwerk-merch-cart';

export function formatVariantLabel(item: { size?: string; color?: string }) {
  return [item.size ? `Größe ${item.size}` : '', item.color ? `Farbe ${item.color}` : ''].filter(Boolean).join(' · ');
}

export function getCartItemKey(item: MerchandiseCartItem) {
  return [item.productId, item.size || '-', item.color || '-'].join('__');
}

export function calculateCartTotal(items: MerchandiseCartItem[], products: MerchandiseProduct[]) {
  return items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      return sum;
    }

    return sum + product.price * item.quantity;
  }, 0);
}

export function validateCheckoutCustomer(customer: MerchandiseCheckoutCustomer) {
  const trimmed = Object.fromEntries(
    Object.entries(customer).map(([key, value]) => [key, value.trim()])
  ) as MerchandiseCheckoutCustomer;

  const missingFields = Object.entries(trimmed)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return { valid: false, message: 'Bitte füllen Sie alle Rechnungsdaten vollständig aus.' } as const;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed.email)) {
    return { valid: false, message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' } as const;
  }

  return { valid: true, customer: trimmed } as const;
}

export function buildCartMetadata(items: MerchandiseCartItem[]) {
  return {
    cartProductIds: items.map((item) => item.productId).join(','),
    cartQuantities: items.map((item) => String(item.quantity)).join(','),
    cartSizes: items.map((item) => item.size || '-').join(','),
    cartColors: items.map((item) => item.color || '-').join(','),
  };
}

export function parseCartMetadata(metadata: Record<string, string | undefined>) {
  const productIds = (metadata.cartProductIds || '').split(',').filter(Boolean);
  const quantities = (metadata.cartQuantities || '').split(',');
  const sizes = (metadata.cartSizes || '').split(',');
  const colors = (metadata.cartColors || '').split(',');

  return productIds.map((productId, index) => ({
    productId,
    quantity: Math.max(1, Number(quantities[index]) || 1),
    size: sizes[index] && sizes[index] !== '-' ? sizes[index] : undefined,
    color: colors[index] && colors[index] !== '-' ? colors[index] : undefined,
  }));
}