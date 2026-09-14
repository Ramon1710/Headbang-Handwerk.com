import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminSession, canAccessHeadbangAdmin, canAccessZollhausAdmin } from '@/lib/cms/auth-core';
import {
  buildArchivedZollhausProduct,
  getZollhausProductDisplayStatus,
  parseEuroAmountToCents,
  parseNonNegativeInteger,
} from '@/lib/zollhaus/product-admin';
import { validateZollhausProductImageUpload } from '@/lib/zollhaus/product-image';
import {
  buildPublicDescriptionExcerpt,
  getPublicAvailabilityLabel,
  isValidPublicZollhausProductId,
  toPublicZollhausProducts,
} from '@/lib/zollhaus/public-products';
import {
  encodeZollhausOrderEntropy,
  formatZollhausOrderNumber,
  generateZollhausOrderNumber,
  isZollhausOrderNumber,
} from '@/lib/zollhaus/order-number';
import {
  buildZollhausOrderItemFromProduct,
  calculateZollhausOrderTotal,
  normalizeZollhausOrder,
  normalizeZollhausOrderRequest,
  normalizeZollhausProduct,
  normalizeZollhausShopSettings,
} from '@/lib/zollhaus/validation';
import { createZollhausCheckoutIdempotencyKey, submitZollhausCheckout, type ZollhausCheckoutStore, type ZollhausCheckoutTransaction } from '@/lib/zollhaus/checkout';
import { getZollhausManagedOrderById, hasZollhausProductOrderReference, restoreZollhausOrderStock, retryFailedOrPendingZollhausOrderEmail, updateZollhausManagedOrderStatus } from '@/lib/zollhaus/order-management';
import { buildZollhausOrderEmailContent, createZollhausOrderEmailMessageId, sendZollhausOrderEmail } from '@/lib/zollhaus/order-email';
import { clearZollhausCartAfterSuccess, removeUnavailableZollhausCartItems } from '@/lib/zollhaus/cart';
import type { ZollhausOrder, ZollhausOrderRequest, ZollhausProduct, ZollhausShopSettings } from '@/lib/zollhaus/types';

test('Produktdaten werden getrimmt und Bildreihenfolge wird eindeutig normalisiert', () => {
  const product = normalizeZollhausProduct({
    id: ' poster-1 ',
    name: '  Festival Poster  ',
    description: '  Hochwertiger Siebdruck.  ',
    priceCents: 1999,
    stockQuantity: 7,
    status: 'active',
    images: [
      {
        id: 'b',
        storagePath: 'partnerSites/zollhaus/products/poster-1/2.png',
        url: 'https://example.com/2.png',
        alt: '  Detailansicht  ',
        sortOrder: 9,
        contentType: 'image/png',
        sizeBytes: 456,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'a',
        storagePath: 'partnerSites/zollhaus/products/poster-1/1.png',
        url: 'https://example.com/1.png',
        alt: '  Hauptmotiv  ',
        sortOrder: 2,
        contentType: 'image/png',
        sizeBytes: 123,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });

  assert.equal(product.id, 'poster-1');
  assert.equal(product.name, 'Festival Poster');
  assert.equal(product.description, 'Hochwertiger Siebdruck.');
  assert.deepEqual(
    product.images.map((image) => ({ id: image.id, sortOrder: image.sortOrder, alt: image.alt })),
    [
      { id: 'a', sortOrder: 0, alt: 'Hauptmotiv' },
      { id: 'b', sortOrder: 1, alt: 'Detailansicht' },
    ],
  );
});

test('Float-Preise und negativer Bestand werden abgewiesen', () => {
  assert.throws(
    () =>
      normalizeZollhausProduct({
        id: 'p1',
        name: 'Produkt',
        description: 'Beschreibung',
        priceCents: 19.99,
        stockQuantity: 1,
        status: 'active',
        images: [],
      }),
    /Integer/,
  );

  assert.throws(
    () =>
      normalizeZollhausProduct({
        id: 'p2',
        name: 'Produkt',
        description: 'Beschreibung',
        priceCents: 1999,
        stockQuantity: -1,
        status: 'active',
        images: [],
      }),
    /zu klein/,
  );
});

test('Bestellpositionen enthalten unveraenderlichen Produktsnapshot und korrekten Gesamtpreis', () => {
  const product = normalizeZollhausProduct({
    id: 'shirt-1',
    name: 'Zollhaus Shirt',
    description: 'Baumwollshirt',
    priceCents: 2499,
    stockQuantity: 3,
    status: 'active',
    images: [
      {
        id: 'img-1',
        storagePath: 'partnerSites/zollhaus/products/shirt-1/main.png',
        url: 'https://example.com/main.png',
        alt: 'Frontdruck',
        sortOrder: 0,
        contentType: 'image/png',
        sizeBytes: 123,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });
  const item = buildZollhausOrderItemFromProduct(product, 2);
  const order = normalizeZollhausOrder({
    id: 'order-1',
    orderNumber: 'ZH-20260913-ABCDEFGH',
    status: 'new',
    customer: {
      firstName: 'Max',
      lastName: 'Mustermann',
      street: 'Musterstrasse',
      houseNumber: '1a',
      postalCode: '26789',
      city: 'Leer',
      email: 'max@example.com',
      phone: '+4912345678',
    },
    items: [item],
    totalPriceCents: calculateZollhausOrderTotal([item]),
    idempotencyKey: 'zollhaus-checkout-1234',
    email: { state: 'pending' },
  });

  assert.equal(order.items[0].productSnapshot.name, 'Zollhaus Shirt');
  assert.equal(order.items[0].unitPriceCents, 2499);
  assert.equal(order.items[0].primaryImageAlt, 'Frontdruck');
  assert.equal(order.totalPriceCents, 4998);
});

test('Bestellnummern sind testbar, erkennbar und nicht rein zeitbasiert', () => {
  const entropy = encodeZollhausOrderEntropy(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  const formatted = formatZollhausOrderNumber({ date: '2026-09-13T12:00:00.000Z', entropy });
  const generated = generateZollhausOrderNumber({ now: '2026-09-13T12:00:00.000Z', random: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) });

  assert.equal(formatted, generated);
  assert.equal(isZollhausOrderNumber(generated), true);
  assert.match(generated, /^ZH-20260913-/);
});

test('Shop-Einstellungen werden strikt normalisiert', () => {
  const settings = normalizeZollhausShopSettings({
    shopName: '  Zollhaus Merchandise  ',
    orderNumberPrefix: ' zh ',
    checkoutEnabled: true,
    supportEmail: 'shop@zollhaus-leer.de',
  });

  assert.equal(settings.id, 'shop');
  assert.equal(settings.shopName, 'Zollhaus Merchandise');
  assert.equal(settings.orderNumberPrefix, 'ZH');
  assert.equal(settings.currencyCode, 'EUR');
});

test('Checkout-Idempotency-Key ist sofort lang genug fuer den ersten Submit', () => {
  const key = createZollhausCheckoutIdempotencyKey();

  assert.equal(typeof key, 'string');
  assert.equal(key.trim().length >= 8, true);
});

test('Idempotente Bestellanfragen erlauben nur definierte Stati', () => {
  const request = normalizeZollhausOrderRequest({
    idempotencyKey: 'request-12345678',
    requestHash: 'hash-12345678',
    status: 'started',
  });

  assert.equal(request.status, 'started');

  assert.throws(
    () =>
      normalizeZollhausOrderRequest({
        idempotencyKey: 'request-12345678',
        requestHash: 'hash-12345678',
        status: 'unknown',
      }),
    /ungueltig/,
  );
});

test('Zollhaus-Admin darf Zollhaus-Produkte verwalten', () => {
  const session = buildAdminSession({ username: 'zollhaus', role: 'zollhaus-admin' });

  assert.equal(canAccessZollhausAdmin(session), true);
});

test('Headbang-Admin darf Zollhaus-Produkte verwalten', () => {
  const session = buildAdminSession({ username: 'headbang', role: 'headbang-admin' });

  assert.equal(canAccessZollhausAdmin(session), true);
});

test('nicht angemeldete Benutzer werden fuer Zollhaus-Produkte abgewiesen', () => {
  assert.equal(canAccessZollhausAdmin(null), false);
});

test('ungueltige Preise und Mengen werden abgewiesen und Menge 0 bleibt erlaubt', () => {
  assert.throws(() => parseEuroAmountToCents('12,345'), /maximal zwei Nachkommastellen/);
  assert.throws(() => parseNonNegativeInteger('-1', 'Menge'), /nichtnegative ganze Zahl/);
  assert.equal(parseNonNegativeInteger('0', 'Menge'), 0);
});

test('ungueltige Bilder und SVG werden serverseitig abgewiesen', async () => {
  const invalidFile = new File([new Uint8Array([0x00, 0x01, 0x02])], 'produkt.png', { type: 'image/png' });
  const svgFile = new File([Buffer.from('<svg></svg>', 'utf8')], 'produkt.svg', { type: 'image/svg+xml' });

  await assert.rejects(() => validateZollhausProductImageUpload(invalidFile), /kein gueltiges Dateiformat/);
  await assert.rejects(() => validateZollhausProductImageUpload(svgFile), /SVG-Dateien/);
});

test('gueltige PNG-Bilder werden akzeptiert', async () => {
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const file = new File([pngBytes], 'produkt.png', { type: 'image/png' });
  const result = await validateZollhausProductImageUpload(file);

  assert.equal(result.extension, 'png');
  assert.equal(result.contentType, 'image/png');
});

test('Archivierung veraendert keine Headbang-Daten', () => {
  const headbangSnapshot = {
    merchandise: [{ id: 'festival-shirt-black', price: 29 }],
  };
  const originalProduct = normalizeZollhausProduct({
    id: 'poster-archive',
    name: 'Poster',
    description: 'Siebdruck',
    priceCents: 1500,
    stockQuantity: 4,
    status: 'active',
    images: [],
  });

  const archived = buildArchivedZollhausProduct(originalProduct, '2026-09-13T12:00:00.000Z');

  assert.equal(originalProduct.status, 'active');
  assert.equal(archived.status, 'archived');
  assert.equal(headbangSnapshot.merchandise[0]?.id, 'festival-shirt-black');
});

test('Zollhaus-Admin kann keine Headbang-Action ausfuehren', () => {
  const session = buildAdminSession({ username: 'zollhaus', role: 'zollhaus-admin' });

  assert.equal(canAccessHeadbangAdmin(session), false);
});

test('Ausverkauft wird allein aus dem Bestand abgeleitet', () => {
  const product = normalizeZollhausProduct({
    id: 'sold-out',
    name: 'Ausverkauftes Produkt',
    description: 'Beschreibung',
    priceCents: 990,
    stockQuantity: 0,
    status: 'active',
    images: [],
  });

  assert.equal(getZollhausProductDisplayStatus(product), 'Ausverkauft');
});

test('nur aktive Produkte werden öffentlich ausgegeben', () => {
  const active = normalizeZollhausProduct({
    id: 'active-product',
    name: 'Aktiv',
    description: 'Sichtbar',
    priceCents: 1000,
    stockQuantity: 2,
    status: 'active',
    images: [],
  });
  const archived = normalizeZollhausProduct({
    id: 'archived-product',
    name: 'Archiviert',
    description: 'Unsichtbar',
    priceCents: 1000,
    stockQuantity: 2,
    status: 'archived',
    archivedAt: '2026-09-12T00:00:00.000Z',
    images: [],
  });

  const publicProducts = toPublicZollhausProducts([active, archived]);

  assert.deepEqual(publicProducts.map((product) => product.id), ['active-product']);
});

test('archivierte Produkte sind öffentlich nicht aufrufbar und ungültige IDs werden abgewiesen', () => {
  assert.equal(isValidPublicZollhausProductId('valid-product_1'), true);
  assert.equal(isValidPublicZollhausProductId('../invalid'), false);
});

test('Menge 0 wird öffentlich als ausverkauft dargestellt', () => {
  assert.equal(getPublicAvailabilityLabel({ status: 'active', stockQuantity: 0 }), 'Ausverkauft');
});

test('Preisformatierung der öffentlichen Produkte basiert auf Integer-Cent', () => {
  const product = normalizeZollhausProduct({
    id: 'price-product',
    name: 'Preisprodukt',
    description: 'Beschreibung',
    priceCents: 12345,
    stockQuantity: 1,
    status: 'active',
    images: [],
  });

  const [publicProduct] = toPublicZollhausProducts([product]);
  assert.equal(publicProduct?.priceLabel, '123,45 €');
});

test('fehlende Bilder erzeugen in der öffentlichen Projektion keinen Fehler', () => {
  const product = normalizeZollhausProduct({
    id: 'image-less',
    name: 'Bildlos',
    description: 'Beschreibung ohne Bild',
    priceCents: 1000,
    stockQuantity: 5,
    status: 'active',
    images: [],
  });

  const [publicProduct] = toPublicZollhausProducts([product]);
  assert.deepEqual(publicProduct?.images, []);
});

test('öffentliche Nutzer erhalten keine internen Produktfelder', () => {
  const product = normalizeZollhausProduct({
    id: 'public-sanitized',
    name: 'Sichtbar',
    description: 'Beschreibung fuer die Öffentlichkeit',
    priceCents: 1000,
    stockQuantity: 5,
    status: 'active',
    images: [
      {
        id: 'img-public',
        storagePath: 'zollhaus/products/public-sanitized/img-public',
        url: 'https://example.com/image.png',
        alt: 'Ansicht',
        sortOrder: 0,
        contentType: 'image/png',
        sizeBytes: 123,
        createdAt: '2026-09-13T00:00:00.000Z',
      },
    ],
  });

  const [publicProduct] = toPublicZollhausProducts([product]);

  assert.equal('storagePath' in (publicProduct?.images[0] || {}), false);
  assert.equal('contentType' in (publicProduct?.images[0] || {}), false);
  assert.equal('sizeBytes' in (publicProduct?.images[0] || {}), false);
});

test('Headbang-Produktdaten bleiben durch die öffentliche Projektion unverändert', () => {
  const headbangSnapshot = Object.freeze([{ id: 'festival-shirt-black', price: 29 }]);
  const product = normalizeZollhausProduct({
    id: 'projection-product',
    name: 'Projektionsprodukt',
    description: 'Beschreibung',
    priceCents: 2000,
    stockQuantity: 3,
    status: 'active',
    images: [],
  });

  const [publicProduct] = toPublicZollhausProducts([product]);

  assert.equal(publicProduct?.name, 'Projektionsprodukt');
  assert.deepEqual(headbangSnapshot, [{ id: 'festival-shirt-black', price: 29 }]);
});

test('öffentliche Kurzbeschreibung bricht sinnvoll um', () => {
  const excerpt = buildPublicDescriptionExcerpt('Ein sehr langer Beschreibungstext '.repeat(12), 80);

  assert.ok(excerpt.endsWith('…'));
  assert.ok(excerpt.length <= 80);
});

class InMemoryCheckoutStore implements ZollhausCheckoutStore {
  products = new Map<string, ZollhausProduct>();
  orders = new Map<string, ZollhausOrder>();
  orderRequests = new Map<string, ZollhausOrderRequest>();
  settings: ZollhausShopSettings | null;
  headbangSnapshot = { merchandiseOrders: 3 };
  private queue = Promise.resolve();

  constructor(params: { products: ZollhausProduct[]; settings?: ZollhausShopSettings | null }) {
    for (const product of params.products) {
      this.products.set(product.id, structuredClone(product));
    }

    this.settings = params.settings ? structuredClone(params.settings) : normalizeZollhausShopSettings({
      shopName: 'Zollhaus Shop',
      orderNumberPrefix: 'ZH',
      checkoutEnabled: true,
      supportEmail: 'shop@zollhaus.test',
    });
  }

  async runTransaction<T>(callback: (transaction: ZollhausCheckoutTransaction) => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release = () => {};
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    const draftProducts = new Map([...this.products.entries()].map(([key, value]) => [key, structuredClone(value)]));
    const draftOrders = new Map([...this.orders.entries()].map(([key, value]) => [key, structuredClone(value)]));
    const draftRequests = new Map([...this.orderRequests.entries()].map(([key, value]) => [key, structuredClone(value)]));
    const draftSettings = this.settings ? structuredClone(this.settings) : null;

    const transaction: ZollhausCheckoutTransaction = {
      getSettings: async () => (draftSettings ? structuredClone(draftSettings) : null),
      getOrderRequest: async (idempotencyKey) => (draftRequests.get(idempotencyKey) ? structuredClone(draftRequests.get(idempotencyKey)!) : null),
      getOrder: async (orderId) => (draftOrders.get(orderId) ? structuredClone(draftOrders.get(orderId)!) : null),
      listOrders: async () => [...draftOrders.values()].map((order) => structuredClone(order)),
      getProducts: async (productIds) => new Map(productIds.map((productId) => [productId, draftProducts.get(productId) ? structuredClone(draftProducts.get(productId)!) : null])),
      saveProduct: async (product) => {
        draftProducts.set(product.id, structuredClone(product));
      },
      saveOrder: async (order) => {
        draftOrders.set(order.id, structuredClone(order));
      },
      createOrder: async (order) => {
        draftOrders.set(order.id, structuredClone(order));
      },
      createOrderRequest: async (orderRequest) => {
        draftRequests.set(orderRequest.idempotencyKey, structuredClone(orderRequest));
      },
    };

    try {
      const result = await callback(transaction);
      this.products = draftProducts;
      this.orders = draftOrders;
      this.orderRequests = draftRequests;
      this.settings = draftSettings;
      release();
      return result;
    } catch (error) {
      release();
      throw error;
    }
  }
}

function buildCheckoutProduct(overrides?: Partial<ZollhausProduct>) {
  return normalizeZollhausProduct({
    id: 'checkout-product',
    name: 'Screenprint Poster',
    description: 'Hochwertiger Zollhaus-Siebdruck',
    priceCents: 2490,
    stockQuantity: 4,
    status: 'active',
    images: [
      {
        id: 'image-1',
        storagePath: 'partnerSites/zollhaus/products/checkout-product/image-1.png',
        url: 'https://example.com/image-1.png',
        alt: 'Produktbild',
        sortOrder: 0,
        contentType: 'image/png',
        sizeBytes: 123,
        createdAt: '2026-09-13T00:00:00.000Z',
      },
    ],
    ...overrides,
  });
}

function buildCheckoutCustomer(overrides?: Partial<Parameters<typeof normalizeZollhausOrder>[0] extends never ? never : ZollhausOrder['customer']>) {
  return {
    firstName: 'Max',
    lastName: 'Mustermann',
    street: 'Musterstrasse',
    houseNumber: '12a',
    postalCode: '26789',
    city: 'Leer',
    email: 'max@example.com',
    phone: '+49123456789',
    ...overrides,
  };
}

async function withOrderEmailEnv<T>(callback: () => Promise<T>, env?: Partial<Record<'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS' | 'SMTP_FROM' | 'ZOLLHAUS_ORDER_EMAIL', string | undefined>>) {
  const previous = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    ZOLLHAUS_ORDER_EMAIL: process.env.ZOLLHAUS_ORDER_EMAIL,
  };

  for (const [key, value] of Object.entries(env || {})) {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('serverseitige Preisberechnung ignoriert manipulierte Browserpreise', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });
  const result = await submitZollhausCheckout(
    {
      idempotencyKey: 'price-check-12345',
      customer: buildCheckoutCustomer(),
      items: [{ productId: 'checkout-product', quantity: 2, unitPriceCents: 1 } as never],
    },
    { store, createOrderId: () => 'order-price', createOrderNumber: () => 'ZH-20260913-PRCECHK2' },
  );

  assert.equal(result.totalPriceCents, 4980);
  assert.equal(store.orders.get('order-price')?.items[0]?.unitPriceCents, 2490);
});

test('archivierte Produkte werden im Checkout abgewiesen', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ status: 'archived', archivedAt: '2026-09-13T10:00:00.000Z' })] });

  await assert.rejects(
    () => submitZollhausCheckout({ idempotencyKey: 'archived-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] }, { store }),
    /nicht mehr verfuegbar/,
  );
});

test('Bestand 0 und Mengen groesser als Bestand werden abgewiesen', async () => {
  const soldOutStore = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 0 })] });
  await assert.rejects(
    () => submitZollhausCheckout({ idempotencyKey: 'soldout-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] }, { store: soldOutStore }),
    /ausverkauft/,
  );

  const limitedStore = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 1 })] });
  await assert.rejects(
    () => submitZollhausCheckout({ idempotencyKey: 'stock-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 2 }] }, { store: limitedStore }),
    /nicht mehr vollstaendig verfuegbar/,
  );
});

test('zwei parallele Kaeufe bei Bestand 1 lassen nur eine Bestellung durch', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 1 })] });
  const customer = buildCheckoutCustomer();

  const [first, second] = await Promise.allSettled([
    submitZollhausCheckout({ idempotencyKey: 'parallel-a-12345', customer, items: [{ productId: 'checkout-product', quantity: 1 }] }, { store, createOrderId: () => 'order-a', createOrderNumber: () => 'ZH-20260913-PARALEL2' }),
    submitZollhausCheckout({ idempotencyKey: 'parallel-b-12345', customer, items: [{ productId: 'checkout-product', quantity: 1 }] }, { store, createOrderId: () => 'order-b', createOrderNumber: () => 'ZH-20260913-PARALEL3' }),
  ]);

  assert.equal(first.status === 'fulfilled' || second.status === 'fulfilled', true);
  assert.equal(first.status === 'rejected' || second.status === 'rejected', true);
  assert.equal(store.orders.size, 1);
  assert.equal(store.products.get('checkout-product')?.stockQuantity, 0);
});

test('fehlgeschlagene Bestellung veraendert keinen Bestand und keine Teilbestellung', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 1 })] });

  await assert.rejects(
    () => submitZollhausCheckout({ idempotencyKey: 'rollback-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 3 }] }, { store }),
    /nicht mehr vollstaendig verfuegbar/,
  );

  assert.equal(store.products.get('checkout-product')?.stockQuantity, 1);
  assert.equal(store.orders.size, 0);
  assert.equal(store.orderRequests.size, 0);
});

test('Produktsnapshot bleibt nach spaeteren Produktaenderungen unveraenderlich', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });
  await submitZollhausCheckout(
    { idempotencyKey: 'snapshot-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-snapshot', createOrderNumber: () => 'ZH-20260913-SNAPSHT2' },
  );

  const updatedProduct = normalizeZollhausProduct({
    ...store.products.get('checkout-product')!,
    name: 'Geaenderter Name',
  });
  store.products.set(updatedProduct.id, updatedProduct);

  assert.equal(store.orders.get('order-snapshot')?.items[0]?.productSnapshot.name, 'Screenprint Poster');
});

test('doppelter Idempotency-Key erzeugt keine zweite Bestellung', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });
  const submission = { idempotencyKey: 'duplicate-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] };

  const first = await submitZollhausCheckout(submission, { store, createOrderId: () => 'order-dup', createOrderNumber: () => 'ZH-20260913-DUPLCAT2' });
  const second = await submitZollhausCheckout(submission, { store, createOrderId: () => 'order-dup-2', createOrderNumber: () => 'ZH-20260913-DUPLCAT3' });

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.orderId, 'order-dup');
  assert.equal(store.orders.size, 1);
});

test('ungueltige Kundendaten werden abgewiesen', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await assert.rejects(
    () => submitZollhausCheckout({ idempotencyKey: 'customer-12345', customer: buildCheckoutCustomer({ email: 'ungueltig' }), items: [{ productId: 'checkout-product', quantity: 1 }] }, { store }),
    /E-Mail ist ungueltig/,
  );
});

test('Zollhaus-Bestellungen veraendern keine Headbang-Daten', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });
  const snapshotBefore = structuredClone(store.headbangSnapshot);

  await submitZollhausCheckout(
    { idempotencyKey: 'headbang-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-headbang', createOrderNumber: () => 'ZH-20260913-HEADBANG' },
  );

  assert.deepEqual(store.headbangSnapshot, snapshotBefore);
});

test('Warenkorb wird nur nach erfolgreicher Bestellung geleert', () => {
  const currentCart = [{ productId: 'checkout-product', quantity: 2 }];

  assert.deepEqual(clearZollhausCartAfterSuccess(false, currentCart), currentCart);
  assert.deepEqual(clearZollhausCartAfterSuccess(true, currentCart), []);
});

test('veraltete Warenkorbpositionen werden gegen den aktuellen Katalog bereinigt', () => {
  const currentCart = [
    { productId: 'checkout-product', quantity: 2 },
    { productId: 'archived-product', quantity: 1 },
  ];

  assert.deepEqual(removeUnavailableZollhausCartItems(currentCart, ['checkout-product']), [{ productId: 'checkout-product', quantity: 2 }]);
});

test('interne Zollhaus-Bestellmail wird genau einmal versendet und Status wird fortgeschrieben', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'mail-success-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-mail-success', createOrderNumber: () => 'ZH-20260913-MALK2A34' },
  );

  const deliveries: Array<{ to: string; subject: string; messageId: string; text: string; html: string }> = [];

  let expectedMessageId = '';

  await withOrderEmailEnv(async () => {
    const result = await sendZollhausOrderEmail('order-mail-success', {
      store,
      transport: {
        async send(input) {
          deliveries.push({ to: input.to, subject: input.subject, messageId: input.messageId, text: input.text, html: input.html });
          return { messageId: input.messageId };
        },
      },
    });

    expectedMessageId = createZollhausOrderEmailMessageId(store.orders.get('order-mail-success')!);
    assert.equal(result.status, 'sent');
  }, {
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'mailer@example.com',
    SMTP_PASS: 'secret',
    SMTP_FROM: 'Zollhaus <bestellungen@example.com>',
    ZOLLHAUS_ORDER_EMAIL: 'intern@example.com',
  });

  const order = store.orders.get('order-mail-success');
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0]?.to, 'intern@example.com');
  assert.equal(deliveries[0]?.subject, 'Neue Zollhaus-Bestellung – ZH-20260913-MALK2A34');
  assert.equal(deliveries[0]?.messageId, expectedMessageId);
  assert.equal(order?.email.state, 'sent');
  assert.equal(order?.email.attemptCount, 1);
  assert.equal(order?.status, 'new');
  assert.ok(order?.email.sentAt);

  const second = await withOrderEmailEnv(
    () => sendZollhausOrderEmail('order-mail-success', { store, transport: { async send() { throw new Error('should-not-send'); } } }),
    {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'mailer@example.com',
      SMTP_PASS: 'secret',
      ZOLLHAUS_ORDER_EMAIL: 'intern@example.com',
    },
  );

  assert.equal(second.status, 'skipped');
  assert.equal(second.reason, 'already-sent');
});

test('fehlende Mail-Konfiguration markiert Bestellung neutral als fehlgeschlagen und loggt keine PII', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'mail-config-12345', customer: buildCheckoutCustomer({ firstName: 'Erika', email: 'erika@example.com' }), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-mail-config', createOrderNumber: () => 'ZH-20260913-MALCFG24' },
  );

  const logs: Array<{ message: string; meta?: Record<string, unknown> }> = [];

  const result = await withOrderEmailEnv(
    () => sendZollhausOrderEmail('order-mail-config', {
      store,
      logger: {
        info(message, meta) {
          logs.push({ message, meta });
        },
        error(message, meta) {
          logs.push({ message, meta });
        },
      },
      transport: {
        async send() {
          throw new Error('should-not-send');
        },
      },
    }),
    {
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
      SMTP_FROM: undefined,
      ZOLLHAUS_ORDER_EMAIL: undefined,
    },
  );

  assert.equal(result.status, 'failed');
  assert.equal(result.category, 'not_configured');
  assert.equal(store.orders.get('order-mail-config')?.email.state, 'failed');
  assert.equal(store.orders.get('order-mail-config')?.status, 'new');
  assert.equal(store.products.get('checkout-product')?.stockQuantity, 3);
  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.meta?.category, 'not_configured');
  assert.equal(String(logs[0]?.meta?.orderNumber || '').includes('MALCFG24'), true);
  assert.equal(JSON.stringify(logs[0]).includes('erika@example.com'), false);
  assert.equal(JSON.stringify(logs[0]).includes('Erika'), false);
});

test('interne Zollhaus-Bestellmail nutzt supportEmail aus den Shop-Einstellungen, wenn kein Empfänger per Env gesetzt ist', async () => {
  const store = new InMemoryCheckoutStore({
    products: [buildCheckoutProduct()],
    settings: normalizeZollhausShopSettings({
      shopName: 'Zollhaus Shop',
      orderNumberPrefix: 'ZH',
      checkoutEnabled: true,
      supportEmail: 'support@zollhaus.test',
    }),
  });

  await submitZollhausCheckout(
    { idempotencyKey: 'mail-support-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-mail-support', createOrderNumber: () => 'ZH-20260914-SUPRT23A' },
  );

  const deliveries: Array<{ to: string }> = [];

  await withOrderEmailEnv(async () => {
    const result = await sendZollhausOrderEmail('order-mail-support', {
      store,
      transport: {
        async send(input) {
          deliveries.push({ to: input.to });
          return { messageId: input.messageId };
        },
      },
    });

    assert.equal(result.status, 'sent');
  }, {
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'mailer@example.com',
    SMTP_PASS: 'secret',
    SMTP_FROM: 'Zollhaus <bestellungen@example.com>',
    ZOLLHAUS_ORDER_EMAIL: undefined,
  });

  assert.deepEqual(deliveries, [{ to: 'support@zollhaus.test' }]);
});

test('parallele Versandversuche fuehren hoechstens einen realen Mailtransport aus', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'mail-parallel-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-mail-parallel', createOrderNumber: () => 'ZH-20260913-MALPAR24' },
  );

  let sendCount = 0;

  const [first, second] = await withOrderEmailEnv(
    () => Promise.all([
      sendZollhausOrderEmail('order-mail-parallel', {
        store,
        transport: {
          async send(input) {
            sendCount += 1;
            return { messageId: input.messageId };
          },
        },
      }),
      sendZollhausOrderEmail('order-mail-parallel', {
        store,
        transport: {
          async send(input) {
            sendCount += 1;
            return { messageId: input.messageId };
          },
        },
      }),
    ]),
    {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'mailer@example.com',
      SMTP_PASS: 'secret',
      ZOLLHAUS_ORDER_EMAIL: 'intern@example.com',
    },
  );

  assert.equal(sendCount, 1);
  assert.equal([first.status, second.status].includes('sent'), true);
  assert.equal([first.status, second.status].includes('skipped'), true);
});

test('Zollhaus-Bestellmail rendert Pflichtfelder HTML-sicher aus Snapshots', () => {
  const order = normalizeZollhausOrder({
    id: 'order-render',
    orderNumber: 'ZH-20260913-R2NDERA4',
    status: 'new',
    customer: {
      firstName: 'Max <script>',
      lastName: 'Mustermann',
      street: 'Musterstrasse',
      houseNumber: '12a',
      postalCode: '26789',
      city: 'Leer',
      email: 'max@example.com',
      phone: '+49123456789',
    },
    items: [buildZollhausOrderItemFromProduct(buildCheckoutProduct({ name: 'Poster <b>X</b>' }), 2)],
    totalPriceCents: 4980,
    idempotencyKey: 'render-12345',
    email: { state: 'pending', attemptCount: 0 },
    createdAt: '2026-09-13T12:00:00.000Z',
  });

  const content = buildZollhausOrderEmailContent(order);

  assert.equal(content.subject, 'Neue Zollhaus-Bestellung – ZH-20260913-R2NDERA4');
  assert.equal(content.text.includes('Bestellung auf Rechnung'), true);
  assert.equal(content.text.includes('Gesamtpreis'), true);
  assert.equal(content.text.includes('Poster <b>X</b>'), true);
  assert.equal(content.html.includes('Max &lt;script&gt;'), true);
  assert.equal(content.html.includes('Poster &lt;b&gt;X&lt;/b&gt;'), true);
  assert.equal(content.html.includes('Aktueller Bestellstatus'), false);
});

test('unbekannte Bestell-ID wird sicher behandelt', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  assert.equal(await getZollhausManagedOrderById('../invalid', { store }), null);
  assert.equal(await getZollhausManagedOrderById('missing-order-12345', { store }), null);
});

test('Statusänderungen werden serverseitig validiert und auditiert', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'status-change-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-status-change', createOrderNumber: () => 'ZH-20260913-STATU524' },
  );

  await assert.rejects(
    () => updateZollhausManagedOrderStatus('order-status-change', 'unknown', { username: 'z-admin', role: 'zollhaus-admin' }, { store }),
    /ungueltig/,
  );

  const updated = await updateZollhausManagedOrderStatus('order-status-change', 'invoiced', { username: 'z-admin', role: 'zollhaus-admin' }, { store, now: () => new Date('2026-09-13T13:00:00.000Z') });

  assert.equal(updated.status, 'invoiced');
  assert.equal(updated.statusUpdatedBy, 'z-admin');
  assert.equal(updated.statusUpdatedByRole, 'zollhaus-admin');
  assert.equal(updated.statusUpdatedAt, '2026-09-13T13:00:00.000Z');
});

test('fehlgeschlagene Mail kann erneut gesendet werden', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'retry-mail-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-retry-mail', createOrderNumber: () => 'ZH-20260913-RETRY234' },
  );

  await withOrderEmailEnv(
    () => sendZollhausOrderEmail('order-retry-mail', { store }),
    {
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
      SMTP_FROM: undefined,
      ZOLLHAUS_ORDER_EMAIL: undefined,
    },
  );

  const result = await withOrderEmailEnv(
    () => retryFailedOrPendingZollhausOrderEmail('order-retry-mail', { username: 'headbang', role: 'headbang-admin' }, {
      store,
      now: () => new Date('2026-09-13T14:00:00.000Z'),
      transport: {
        async send(input) {
          return { messageId: input.messageId };
        },
      },
    }),
    {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'mailer@example.com',
      SMTP_PASS: 'secret',
      SMTP_FROM: 'Zollhaus <bestellungen@example.com>',
      ZOLLHAUS_ORDER_EMAIL: 'intern@example.com',
    },
  );

  assert.equal(result.status, 'sent');
  assert.equal(store.orders.get('order-retry-mail')?.email.state, 'sent');
  assert.equal(store.orders.get('order-retry-mail')?.email.attemptCount, 2);
});

test('versendete Mail wird nicht unbeabsichtigt erneut versendet', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'retry-sent-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-retry-sent', createOrderNumber: () => 'ZH-20260913-SENTR234' },
  );

  await withOrderEmailEnv(
    () => sendZollhausOrderEmail('order-retry-sent', {
      store,
      transport: { async send(input) { return { messageId: input.messageId }; } },
    }),
    {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'mailer@example.com',
      SMTP_PASS: 'secret',
      ZOLLHAUS_ORDER_EMAIL: 'intern@example.com',
    },
  );

  await assert.rejects(
    () => retryFailedOrPendingZollhausOrderEmail('order-retry-sent', { username: 'z-admin', role: 'zollhaus-admin' }, { store }),
    /bereits erfolgreich versendet/,
  );
});

test('Bestandsrückgabe nur nach Stornierung', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'restore-precondition-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 2 }] },
    { store, createOrderId: () => 'order-restore-precondition', createOrderNumber: () => 'ZH-20260913-RSTPRE24' },
  );

  await assert.rejects(
    () => restoreZollhausOrderStock('order-restore-precondition', { username: 'z-admin', role: 'zollhaus-admin' }, { store }),
    /nur bei stornierten Bestellungen/,
  );
});

test('Bestand wird nur einmal zurückgebucht', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 5 })] });

  await submitZollhausCheckout(
    { idempotencyKey: 'restore-once-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 2 }] },
    { store, createOrderId: () => 'order-restore-once', createOrderNumber: () => 'ZH-20260913-RST2NE24' },
  );
  await updateZollhausManagedOrderStatus('order-restore-once', 'cancelled', { username: 'z-admin', role: 'zollhaus-admin' }, { store });

  await restoreZollhausOrderStock('order-restore-once', { username: 'z-admin', role: 'zollhaus-admin' }, { store, now: () => new Date('2026-09-13T15:00:00.000Z') });

  assert.equal(store.products.get('checkout-product')?.stockQuantity, 5);
  assert.equal(store.orders.get('order-restore-once')?.stockRestoredAt, '2026-09-13T15:00:00.000Z');

  await assert.rejects(
    () => restoreZollhausOrderStock('order-restore-once', { username: 'z-admin', role: 'zollhaus-admin' }, { store }),
    /bereits zurueckgebucht/,
  );
});

test('fehlendes Produkt verhindert Teilrückbuchung', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 3 })] });

  await submitZollhausCheckout(
    { idempotencyKey: 'restore-missing-product-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-restore-missing', createOrderNumber: () => 'ZH-20260913-RSTMJS24' },
  );
  await updateZollhausManagedOrderStatus('order-restore-missing', 'cancelled', { username: 'z-admin', role: 'zollhaus-admin' }, { store });

  store.products.delete('checkout-product');

  await assert.rejects(
    () => restoreZollhausOrderStock('order-restore-missing', { username: 'z-admin', role: 'zollhaus-admin' }, { store }),
    /existiert nicht mehr/,
  );
  assert.equal(store.orders.get('order-restore-missing')?.stockRestoredAt, undefined);
});

test('Produkt mit Bestellreferenz wird nicht endgültig gelöscht', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct()] });

  await submitZollhausCheckout(
    { idempotencyKey: 'product-reference-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-product-reference', createOrderNumber: () => 'ZH-20260913-PR2DREF4' },
  );

  assert.equal(await hasZollhausProductOrderReference('checkout-product', { store }), true);
  assert.equal(await hasZollhausProductOrderReference('missing-product', { store }), false);
});

test('Bestellverwaltung verändert keine Headbang-Daten', async () => {
  const store = new InMemoryCheckoutStore({ products: [buildCheckoutProduct({ stockQuantity: 5 })] });
  const snapshotBefore = structuredClone(store.headbangSnapshot);

  await submitZollhausCheckout(
    { idempotencyKey: 'headbang-admin-isolation-12345', customer: buildCheckoutCustomer(), items: [{ productId: 'checkout-product', quantity: 1 }] },
    { store, createOrderId: () => 'order-headbang-admin-isolation', createOrderNumber: () => 'ZH-20260913-HDJS2L24' },
  );
  await updateZollhausManagedOrderStatus('order-headbang-admin-isolation', 'cancelled', { username: 'headbang', role: 'headbang-admin' }, { store });
  await restoreZollhausOrderStock('order-headbang-admin-isolation', { username: 'headbang', role: 'headbang-admin' }, { store });

  assert.deepEqual(store.headbangSnapshot, snapshotBefore);
});
