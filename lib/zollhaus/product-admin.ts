import type { ZollhausProduct } from '@/lib/zollhaus/types';

const EURO_FORMATTER = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export function parseEuroAmountToCents(input: unknown) {
  const raw = String(input ?? '').trim().replace(/\s+/g, '').replace(',', '.');

  if (!raw) {
    throw new Error('Bitte einen Preis eingeben.');
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error('Der Preis muss als Eurobetrag mit maximal zwei Nachkommastellen eingegeben werden.');
  }

  const [eurosPart, centsPart = ''] = raw.split('.');
  const euros = Number.parseInt(eurosPart, 10);
  const cents = Number.parseInt(centsPart.padEnd(2, '0').slice(0, 2) || '0', 10);

  if (!Number.isInteger(euros) || !Number.isInteger(cents)) {
    throw new Error('Der Preis ist ungueltig.');
  }

  return euros * 100 + cents;
}

export function formatPriceCentsForInput(priceCents: number) {
  const euros = Math.trunc(priceCents / 100);
  const cents = Math.abs(priceCents % 100);

  return `${euros},${String(cents).padStart(2, '0')}`;
}

export function formatPriceCentsForDisplay(priceCents: number) {
  return EURO_FORMATTER.format(priceCents / 100);
}

export function parseNonNegativeInteger(input: unknown, label: string) {
  const value = String(input ?? '').trim();

  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} muss eine nichtnegative ganze Zahl sein.`);
  }

  return Number.parseInt(value, 10);
}

export function getZollhausProductDisplayStatus(product: Pick<ZollhausProduct, 'status' | 'stockQuantity'>) {
  if (product.status === 'archived') {
    return 'Archiviert';
  }

  if (product.stockQuantity === 0) {
    return 'Ausverkauft';
  }

  return 'Aktiv';
}

export function buildArchivedZollhausProduct(product: ZollhausProduct, archivedAt = new Date().toISOString()): ZollhausProduct {
  return {
    ...product,
    status: 'archived',
    archivedAt,
    updatedAt: archivedAt,
  };
}

export function buildProductPreviewModel(product?: Partial<ZollhausProduct> | null): ZollhausProduct {
  const now = new Date().toISOString();

  return {
    id: product?.id || 'preview-product',
    name: product?.name || 'Neues Zollhaus-Produkt',
    description: product?.description || 'Hier erscheint die Produktbeschreibung in der Kartenansicht.',
    priceCents: typeof product?.priceCents === 'number' ? product.priceCents : 0,
    stockQuantity: typeof product?.stockQuantity === 'number' ? product.stockQuantity : 0,
    images: Array.isArray(product?.images) ? product.images : [],
    status: product?.status === 'active' || product?.status === 'archived' ? product.status : 'archived',
    createdAt: product?.createdAt || now,
    updatedAt: product?.updatedAt || now,
    ...(product?.archivedAt ? { archivedAt: product.archivedAt } : {}),
  };
}
