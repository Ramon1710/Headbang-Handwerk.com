import {
  type ZollhausAdminActorRole,
  type ZollhausOrder,
  type ZollhausOrderCustomer,
  type ZollhausOrderEmailErrorCategory,
  type ZollhausOrderEmailStatus,
  type ZollhausOrderItem,
  type ZollhausOrderRequestState,
  type ZollhausOrderStatus,
  type ZollhausOrderRequest,
  type ZollhausProduct,
  type ZollhausProductImage,
  type ZollhausProductStatus,
  type ZollhausShopSettings,
} from '@/lib/zollhaus/types';
import { isZollhausOrderNumber } from '@/lib/zollhaus/order-number';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeIsoTimestamp(input: unknown, fallback: string) {
  const value = String(input || '').trim();

  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungueltiger Zeitstempel.');
  }

  return date.toISOString();
}

function normalizeBoundedText(
  input: unknown,
  label: string,
  options: { minLength?: number; maxLength: number; allowMultiline?: boolean; allowEmpty?: boolean }
) {
  const raw = String(input ?? '');
  const value = options.allowMultiline ? raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : raw.trim();

  if (!options.allowEmpty && !value) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new Error(`${label} ist zu kurz.`);
  }

  if (value.length > options.maxLength) {
    throw new Error(`${label} ist zu lang.`);
  }

  return value;
}

function normalizeInteger(input: unknown, label: string, options?: { min?: number; max?: number }) {
  const value = typeof input === 'number' ? input : Number(String(input ?? '').trim());

  if (!Number.isInteger(value)) {
    throw new Error(`${label} muss als Integer gespeichert werden.`);
  }

  if (typeof options?.min === 'number' && value < options.min) {
    throw new Error(`${label} ist zu klein.`);
  }

  if (typeof options?.max === 'number' && value > options.max) {
    throw new Error(`${label} ist zu gross.`);
  }

  return value;
}

function normalizeOptionalText(input: unknown, label: string, maxLength: number) {
  return normalizeBoundedText(input, label, { allowEmpty: true, maxLength });
}

function normalizeProductStatus(input: unknown): ZollhausProductStatus {
  const value = String(input || '').trim();

  if (value === 'active' || value === 'archived') {
    return value;
  }

  throw new Error('Produktstatus ist ungueltig.');
}

function normalizeOrderStatus(input: unknown): ZollhausOrderStatus {
  const value = String(input || '').trim();

  if (
    value === 'new' ||
    value === 'email_sent' ||
    value === 'email_failed' ||
    value === 'invoiced' ||
    value === 'shipped' ||
    value === 'cancelled'
  ) {
    return value;
  }

  throw new Error('Bestellstatus ist ungueltig.');
}

function normalizeOrderRequestStatus(input: unknown): ZollhausOrderRequestState {
  const value = String(input || '').trim();

  if (value === 'started' || value === 'completed' || value === 'failed') {
    return value;
  }

  throw new Error('Bestellanfrage-Status ist ungueltig.');
}

function normalizeAdminActorRole(input: unknown): ZollhausAdminActorRole {
  const value = String(input || '').trim();

  if (value === 'headbang-admin' || value === 'zollhaus-admin') {
    return value;
  }

  throw new Error('Admin-Rolle ist ungueltig.');
}

function normalizeImageList(input: unknown, now: string): ZollhausProductImage[] {
  const entries = Array.isArray(input) ? input : [];

  const normalized = entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Produktbild ist ungueltig.');
    }

    const candidate = entry as Record<string, unknown>;

    return {
      id: normalizeBoundedText(candidate.id, 'Bild-ID', { maxLength: 120 }),
      storagePath: normalizeBoundedText(candidate.storagePath, 'Bildpfad', { maxLength: 512 }),
      url: normalizeBoundedText(candidate.url, 'Bild-URL', { maxLength: 2048 }),
      alt: normalizeBoundedText(candidate.alt, 'Bild-Alternativtext', { maxLength: 240 }),
      sortOrder: normalizeInteger(candidate.sortOrder ?? index, 'Bildreihenfolge', { min: 0, max: 10_000 }),
      contentType: normalizeBoundedText(candidate.contentType, 'Bild-Content-Type', { maxLength: 120 }),
      sizeBytes: normalizeInteger(candidate.sizeBytes, 'Bildgroesse', { min: 0, max: 50_000_000 }),
      createdAt: normalizeIsoTimestamp(candidate.createdAt, now),
    } satisfies ZollhausProductImage;
  });

  return normalized
    .sort((left, right) => (left.sortOrder === right.sortOrder ? left.id.localeCompare(right.id) : left.sortOrder - right.sortOrder))
    .map((image, index) => ({
      ...image,
      sortOrder: index,
    }));
}

function normalizeCustomer(input: unknown): ZollhausOrderCustomer {
  if (!input || typeof input !== 'object') {
    throw new Error('Kundendaten fehlen.');
  }

  const candidate = input as Record<string, unknown>;
  const email = normalizeBoundedText(candidate.email, 'E-Mail', { maxLength: 320 });

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('E-Mail ist ungueltig.');
  }

  return {
    firstName: normalizeBoundedText(candidate.firstName, 'Vorname', { maxLength: 120 }),
    lastName: normalizeBoundedText(candidate.lastName, 'Nachname', { maxLength: 120 }),
    street: normalizeBoundedText(candidate.street, 'Strasse', { maxLength: 160 }),
    houseNumber: normalizeBoundedText(candidate.houseNumber, 'Hausnummer', { maxLength: 40 }),
    postalCode: normalizeBoundedText(candidate.postalCode, 'Postleitzahl', { maxLength: 20 }),
    city: normalizeBoundedText(candidate.city, 'Ort', { maxLength: 120 }),
    email,
    phone: normalizeBoundedText(candidate.phone, 'Telefon', { maxLength: 60 }),
  };
}

function normalizeEmailStatus(input: unknown, now: string): ZollhausOrderEmailStatus {
  if (!input || typeof input !== 'object') {
    return { state: 'pending', attemptCount: 0 };
  }

  const candidate = input as Record<string, unknown>;
  const state = String(candidate.state || '').trim();

  if (state !== 'pending' && state !== 'sending' && state !== 'sent' && state !== 'failed') {
    throw new Error('E-Mail-Status ist ungueltig.');
  }

  const attemptCount = normalizeInteger(candidate.attemptCount ?? 0, 'E-Mail-Versuche', { min: 0, max: 10_000 });
  const lastErrorCategory = String(candidate.lastErrorCategory || '').trim();

  if (
    lastErrorCategory
    && lastErrorCategory !== 'not_configured'
    && lastErrorCategory !== 'transport_error'
    && lastErrorCategory !== 'unknown'
  ) {
    throw new Error('E-Mail-Fehlerkategorie ist ungueltig.');
  }

  return {
    state,
    attemptCount,
    ...(candidate.lastAttemptAt ? { lastAttemptAt: normalizeIsoTimestamp(candidate.lastAttemptAt, now) } : {}),
    ...(candidate.sentAt ? { sentAt: normalizeIsoTimestamp(candidate.sentAt, now) } : {}),
    ...(lastErrorCategory ? { lastErrorCategory: lastErrorCategory as ZollhausOrderEmailErrorCategory } : {}),
    ...(String(candidate.providerMessageId || '').trim()
      ? { providerMessageId: normalizeOptionalText(candidate.providerMessageId, 'Provider-Message-ID', 320) }
      : {}),
    ...(String(candidate.sendingClaimId || '').trim()
      ? { sendingClaimId: normalizeOptionalText(candidate.sendingClaimId, 'Versand-Claim-ID', 120) }
      : {}),
    ...(candidate.sendingClaimedAt ? { sendingClaimedAt: normalizeIsoTimestamp(candidate.sendingClaimedAt, now) } : {}),
    ...(!lastErrorCategory && String(candidate.errorMessage || '').trim()
      ? { lastErrorCategory: 'unknown' as ZollhausOrderEmailErrorCategory }
      : {}),
  };
}

export function normalizeZollhausProduct(input: unknown, options?: { now?: string; existing?: Partial<ZollhausProduct> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Produktdaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const status = normalizeProductStatus(candidate.status ?? existing?.status ?? 'active');
  const createdAt = normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now);
  const archivedAt = candidate.archivedAt ?? existing?.archivedAt;

  return {
    id: normalizeBoundedText(candidate.id ?? existing?.id, 'Produkt-ID', { maxLength: 120 }),
    name: normalizeBoundedText(candidate.name ?? existing?.name, 'Produktname', { maxLength: 140 }),
    description: normalizeBoundedText(candidate.description ?? existing?.description, 'Produktbeschreibung', {
      maxLength: 5_000,
      allowMultiline: true,
    }),
    priceCents: normalizeInteger(candidate.priceCents ?? existing?.priceCents, 'Produktpreis', { min: 0, max: 10_000_000 }),
    stockQuantity: normalizeInteger(candidate.stockQuantity ?? existing?.stockQuantity, 'Lagerbestand', { min: 0, max: 1_000_000 }),
    images: normalizeImageList(candidate.images ?? existing?.images, now),
    status,
    createdAt,
    updatedAt: now,
    ...(status === 'archived' || archivedAt
      ? { archivedAt: normalizeIsoTimestamp(archivedAt, now) }
      : {}),
  } satisfies ZollhausProduct;
}

export function buildZollhausOrderItemFromProduct(product: ZollhausProduct, quantity: unknown): ZollhausOrderItem {
  const normalizedQuantity = normalizeInteger(quantity, 'Bestellmenge', { min: 1, max: 10_000 });
  const primaryImage = product.images[0];

  return {
    productId: product.id,
    quantity: normalizedQuantity,
    productSnapshot: {
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      status: product.status,
      ...(primaryImage?.alt ? { primaryImageAlt: primaryImage.alt } : {}),
    },
    productName: product.name,
    unitPriceCents: product.priceCents,
    ...(primaryImage?.alt ? { primaryImageAlt: primaryImage.alt } : {}),
  };
}

export function calculateZollhausOrderTotal(items: ZollhausOrderItem[]) {
  return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export function normalizeZollhausOrder(input: unknown, options?: { now?: string; existing?: Partial<ZollhausOrder> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Bestelldaten fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const status = normalizeOrderStatus(candidate.status ?? existing?.status ?? 'new');
  const itemsSource = candidate.items ?? existing?.items;

  const itemsRaw = Array.isArray(itemsSource) ? itemsSource : null;

  if (!itemsRaw || itemsRaw.length === 0) {
    throw new Error('Bestellung muss mindestens eine Position enthalten.');
  }

  const items = itemsRaw.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Bestellposition ist ungueltig.');
    }

    const line = entry as Record<string, unknown>;
    const snapshotSource = line.productSnapshot;

    if (!snapshotSource || typeof snapshotSource !== 'object') {
      throw new Error('Produktsnapshot fehlt.');
    }

    const snapshot = snapshotSource as Record<string, unknown>;
    const primaryImageAlt = normalizeOptionalText(line.primaryImageAlt ?? snapshot.primaryImageAlt, 'Bildbeschreibung', 240);

    return {
      productId: normalizeBoundedText(line.productId, 'Produkt-ID', { maxLength: 120 }),
      quantity: normalizeInteger(line.quantity, 'Bestellmenge', { min: 1, max: 10_000 }),
      productSnapshot: {
        id: normalizeBoundedText(snapshot.id, 'Snapshot-Produkt-ID', { maxLength: 120 }),
        name: normalizeBoundedText(snapshot.name, 'Snapshot-Produktname', { maxLength: 140 }),
        description: normalizeBoundedText(snapshot.description, 'Snapshot-Produktbeschreibung', {
          maxLength: 5_000,
          allowMultiline: true,
        }),
        priceCents: normalizeInteger(snapshot.priceCents, 'Snapshot-Produktpreis', { min: 0, max: 10_000_000 }),
        status: normalizeProductStatus(snapshot.status),
        ...(primaryImageAlt ? { primaryImageAlt } : {}),
      },
      productName: normalizeBoundedText(line.productName, 'Artikelname', { maxLength: 140 }),
      unitPriceCents: normalizeInteger(line.unitPriceCents, 'Einzelpreis', { min: 0, max: 10_000_000 }),
      ...(primaryImageAlt ? { primaryImageAlt } : {}),
    } satisfies ZollhausOrderItem;
  });

  const totalPriceCents = normalizeInteger(candidate.totalPriceCents ?? calculateZollhausOrderTotal(items), 'Gesamtpreis', {
    min: 0,
    max: 100_000_000,
  });

  if (totalPriceCents !== calculateZollhausOrderTotal(items)) {
    throw new Error('Gesamtpreis passt nicht zu den Bestellpositionen.');
  }

  const orderNumber = normalizeBoundedText(candidate.orderNumber ?? existing?.orderNumber, 'Bestellnummer', { maxLength: 32 });

  if (!isZollhausOrderNumber(orderNumber)) {
    throw new Error('Bestellnummer ist ungueltig.');
  }

  return {
    id: normalizeBoundedText(candidate.id ?? existing?.id, 'Bestell-ID', { maxLength: 120 }),
    orderNumber,
    status,
    customer: normalizeCustomer(candidate.customer ?? existing?.customer),
    items,
    totalPriceCents,
    idempotencyKey: normalizeBoundedText(candidate.idempotencyKey ?? existing?.idempotencyKey, 'Idempotency-Key', {
      minLength: 8,
      maxLength: 200,
    }),
    email: normalizeEmailStatus(candidate.email ?? existing?.email, now),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
    ...(candidate.statusUpdatedAt ?? existing?.statusUpdatedAt
      ? { statusUpdatedAt: normalizeIsoTimestamp(candidate.statusUpdatedAt ?? existing?.statusUpdatedAt, now) }
      : {}),
    ...(candidate.statusUpdatedBy ?? existing?.statusUpdatedBy
      ? { statusUpdatedBy: normalizeBoundedText(candidate.statusUpdatedBy ?? existing?.statusUpdatedBy, 'Status geaendert von', { maxLength: 120 }) }
      : {}),
    ...(candidate.statusUpdatedByRole ?? existing?.statusUpdatedByRole
      ? { statusUpdatedByRole: normalizeAdminActorRole(candidate.statusUpdatedByRole ?? existing?.statusUpdatedByRole) }
      : {}),
    ...(candidate.cancelledAt ?? existing?.cancelledAt
      ? { cancelledAt: normalizeIsoTimestamp(candidate.cancelledAt ?? existing?.cancelledAt, now) }
      : {}),
    ...(candidate.stockRestoredAt ?? existing?.stockRestoredAt
      ? { stockRestoredAt: normalizeIsoTimestamp(candidate.stockRestoredAt ?? existing?.stockRestoredAt, now) }
      : {}),
    ...(candidate.stockRestoredBy ?? existing?.stockRestoredBy
      ? { stockRestoredBy: normalizeBoundedText(candidate.stockRestoredBy ?? existing?.stockRestoredBy, 'Bestand zurueckgebucht von', { maxLength: 120 }) }
      : {}),
    ...(candidate.stockRestoredByRole ?? existing?.stockRestoredByRole
      ? { stockRestoredByRole: normalizeAdminActorRole(candidate.stockRestoredByRole ?? existing?.stockRestoredByRole) }
      : {}),
  } satisfies ZollhausOrder;
}

export function normalizeZollhausShopSettings(input: unknown, options?: { now?: string; existing?: Partial<ZollhausShopSettings> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Shop-Einstellungen fehlen.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const supportEmail = normalizeBoundedText(candidate.supportEmail ?? existing?.supportEmail, 'Support-E-Mail', { maxLength: 320 });

  if (!EMAIL_REGEX.test(supportEmail)) {
    throw new Error('Support-E-Mail ist ungueltig.');
  }

  return {
    id: 'shop',
    shopName: normalizeBoundedText(candidate.shopName ?? existing?.shopName ?? 'Zollhaus Shop', 'Shop-Name', { maxLength: 140 }),
    currencyCode: 'EUR',
    orderNumberPrefix: normalizeBoundedText(candidate.orderNumberPrefix ?? existing?.orderNumberPrefix ?? 'ZH', 'Bestellpraefix', {
      maxLength: 8,
    }).toUpperCase(),
    checkoutEnabled: Boolean(candidate.checkoutEnabled ?? existing?.checkoutEnabled ?? false),
    supportEmail,
    checkoutShippingNotice: normalizeBoundedText(
      candidate.checkoutShippingNotice ?? existing?.checkoutShippingNotice ?? '[PLATZHALTER - NICHT PRODUKTIONSREIF] Versandkosten und rechtliche Pflichtangaben werden vor dem Livegang in den Zollhaus-Shop-Einstellungen ergänzt.',
      'Checkout-Hinweis Versand',
      { maxLength: 600 }
    ),
    checkoutInvoiceNotice: normalizeBoundedText(
      candidate.checkoutInvoiceNotice ?? existing?.checkoutInvoiceNotice ?? '[PLATZHALTER - NICHT PRODUKTIONSREIF] Bestellung auf Rechnung. Noch keine Onlinezahlung. Rechnung und weitere Informationen folgen später per E-Mail.',
      'Checkout-Hinweis Rechnung',
      { maxLength: 600 }
    ),
    checkoutLegalNotice: normalizeBoundedText(
      candidate.checkoutLegalNotice ?? existing?.checkoutLegalNotice ?? '[PLATZHALTER - VOR LIVEGANG RECHTLICH PRUEFEN] Mit dem Absenden geben Sie eine zahlungspflichtige Bestellung auf Rechnung ab.',
      'Checkout-Rechtstext',
      { maxLength: 600 }
    ),
    checkoutSubmitButtonLabel: normalizeBoundedText(
      candidate.checkoutSubmitButtonLabel ?? existing?.checkoutSubmitButtonLabel ?? '[PLATZHALTER] Zahlungspflichtig auf Rechnung bestellen',
      'Checkout-Buttontext',
      { maxLength: 140 }
    ),
    checkoutConfirmationNotice: normalizeBoundedText(
      candidate.checkoutConfirmationNotice ?? existing?.checkoutConfirmationNotice ?? '[PLATZHALTER - NICHT PRODUKTIONSREIF] Ihre Rechnung beziehungsweise weitere Informationen folgen später per E-Mail.',
      'Checkout-Bestaetigungstext',
      { maxLength: 600 }
    ),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
  } satisfies ZollhausShopSettings;
}

export function normalizeZollhausOrderRequest(input: unknown, options?: { now?: string; existing?: Partial<ZollhausOrderRequest> }) {
  if (!input || typeof input !== 'object') {
    throw new Error('Bestellanfrage fehlt.');
  }

  const now = normalizeIsoTimestamp(options?.now, new Date().toISOString());
  const candidate = input as Record<string, unknown>;
  const existing = options?.existing;
  const status = normalizeOrderRequestStatus(candidate.status ?? existing?.status ?? 'started');

  return {
    idempotencyKey: normalizeBoundedText(candidate.idempotencyKey ?? existing?.idempotencyKey, 'Idempotency-Key', {
      minLength: 8,
      maxLength: 200,
    }),
    requestHash: normalizeBoundedText(candidate.requestHash ?? existing?.requestHash, 'Request-Hash', { minLength: 8, maxLength: 200 }),
    status,
    ...(candidate.orderId ?? existing?.orderId
      ? { orderId: normalizeBoundedText(candidate.orderId ?? existing?.orderId, 'Bestell-ID', { maxLength: 120 }) }
      : {}),
    ...(candidate.orderNumber ?? existing?.orderNumber
      ? { orderNumber: normalizeBoundedText(candidate.orderNumber ?? existing?.orderNumber, 'Bestellnummer', { maxLength: 32 }) }
      : {}),
    createdAt: normalizeIsoTimestamp(candidate.createdAt ?? existing?.createdAt, now),
    updatedAt: now,
    ...(candidate.completedAt ?? existing?.completedAt
      ? { completedAt: normalizeIsoTimestamp(candidate.completedAt ?? existing?.completedAt, now) }
      : {}),
    ...(String(candidate.lastError ?? existing?.lastError ?? '').trim()
      ? { lastError: normalizeOptionalText(candidate.lastError ?? existing?.lastError, 'Bestellanfrage-Fehler', 500) }
      : {}),
  } satisfies ZollhausOrderRequest;
}
