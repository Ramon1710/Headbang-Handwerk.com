import type { ZollhausProduct } from '@/lib/zollhaus/types';
import { formatPriceCentsForDisplay } from '@/lib/zollhaus/product-admin';

export interface PublicZollhausProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface PublicZollhausProduct {
  id: string;
  href: string;
  name: string;
  description: string;
  shortDescription: string;
  priceCents: number;
  priceLabel: string;
  availabilityLabel: string;
  stockQuantity: number;
  isSoldOut: boolean;
  images: PublicZollhausProductImage[];
}

export function isValidPublicZollhausProductId(productId: string) {
  return /^[A-Za-z0-9_-]{1,120}$/.test(productId);
}

export function getPublicAvailabilityLabel(product: Pick<ZollhausProduct, 'status' | 'stockQuantity'>) {
  if (product.status !== 'active') {
    return 'Nicht öffentlich verfügbar';
  }

  if (product.stockQuantity === 0) {
    return 'Ausverkauft';
  }

  if (product.stockQuantity === 1) {
    return '1 Stück verfügbar';
  }

  return `${product.stockQuantity} Stück verfügbar`;
}

export function buildPublicDescriptionExcerpt(description: string, maxLength = 160) {
  const normalized = description.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');

  return `${(lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

export function toPublicZollhausProduct(product: ZollhausProduct): PublicZollhausProduct {
  return {
    id: product.id,
    href: `/zollhaus/produkt/${encodeURIComponent(product.id)}`,
    name: product.name,
    description: product.description,
    shortDescription: buildPublicDescriptionExcerpt(product.description),
    priceCents: product.priceCents,
    priceLabel: formatPriceCentsForDisplay(product.priceCents),
    availabilityLabel: getPublicAvailabilityLabel(product),
    stockQuantity: product.stockQuantity,
    isSoldOut: product.stockQuantity === 0,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
    })),
  };
}

export function toPublicZollhausProducts(products: ZollhausProduct[]) {
  return products
    .filter((product) => product.status === 'active')
    .map(toPublicZollhausProduct);
}
