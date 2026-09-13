import { createHash, randomUUID } from 'node:crypto';
import { generateZollhausOrderNumber } from '@/lib/zollhaus/order-number';
import {
  buildZollhausOrderItemFromProduct,
  calculateZollhausOrderTotal,
  normalizeZollhausOrder,
  normalizeZollhausOrderRequest,
  normalizeZollhausProduct,
  normalizeZollhausShopSettings,
} from '@/lib/zollhaus/validation';
import type { ZollhausOrder, ZollhausOrderCustomer, ZollhausOrderRequest, ZollhausProduct, ZollhausShopSettings } from '@/lib/zollhaus/types';

export const ZOLLHAUS_CHECKOUT_MAX_CART_ITEMS = 20;
export const ZOLLHAUS_CHECKOUT_MAX_TOTAL_QUANTITY = 100;
export const ZOLLHAUS_CHECKOUT_MAX_QUANTITY_PER_ITEM = 100;
export const ZOLLHAUS_CHECKOUT_HONEYPOT_FIELD = 'website';

export interface ZollhausCheckoutCartItemInput {
  productId: string;
  quantity: number;
}

export interface ZollhausCheckoutSubmission {
  idempotencyKey: string;
  customer: ZollhausOrderCustomer;
  items: ZollhausCheckoutCartItemInput[];
}

export interface ZollhausCheckoutResult {
  created: boolean;
  orderId: string;
  orderNumber: string;
  totalPriceCents: number;
  items: ZollhausOrder['items'];
}

export interface ZollhausCheckoutTransaction {
  getSettings(): Promise<ZollhausShopSettings | null>;
  getOrderRequest(idempotencyKey: string): Promise<ZollhausOrderRequest | null>;
  getOrder(orderId: string): Promise<ZollhausOrder | null>;
  listOrders(): Promise<ZollhausOrder[]>;
  getProducts(productIds: string[]): Promise<Map<string, ZollhausProduct | null>>;
  saveProduct(product: ZollhausProduct): Promise<void>;
  saveOrder(order: ZollhausOrder): Promise<void>;
  createOrder(order: ZollhausOrder): Promise<void>;
  createOrderRequest(orderRequest: ZollhausOrderRequest): Promise<void>;
}

export interface ZollhausCheckoutStore {
  runTransaction<T>(callback: (transaction: ZollhausCheckoutTransaction) => Promise<T>): Promise<T>;
}

export class ZollhausCheckoutError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ZollhausCheckoutError';
  }
}

function assertCheckoutError(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new ZollhausCheckoutError(code, message);
  }
}

function normalizeCheckoutSettings(settings: ZollhausShopSettings | null, now: string) {
  assertCheckoutError(settings, 'checkout_unavailable', 'Der Zollhaus-Shop ist derzeit nicht fuer Bestellungen eingerichtet.');

  return normalizeZollhausShopSettings(settings, { existing: settings, now });
}

function normalizeOrderCustomerForCheckout(customer: ZollhausOrderCustomer) {
  const normalized = normalizeZollhausOrder({
    id: 'preview-order',
    orderNumber: 'ZH-20260913-ABCDEFGH',
    status: 'new',
    customer,
    items: [
      {
        productId: 'preview-item',
        quantity: 1,
        productSnapshot: {
          id: 'preview-item',
          name: 'Preview',
          description: 'Preview',
          priceCents: 0,
          status: 'active',
        },
        productName: 'Preview',
        unitPriceCents: 0,
      },
    ],
    totalPriceCents: 0,
    idempotencyKey: 'preview-idempotency-key',
    email: { state: 'pending', attemptCount: 0 },
  });

  return normalized.customer;
}

function normalizeCartItems(items: ZollhausCheckoutCartItemInput[]) {
  assertCheckoutError(Array.isArray(items) && items.length > 0, 'empty_cart', 'Der Warenkorb ist leer.');
  assertCheckoutError(items.length <= ZOLLHAUS_CHECKOUT_MAX_CART_ITEMS, 'cart_too_large', 'Der Warenkorb ist zu gross.');

  const merged = new Map<string, number>();

  for (const entry of items) {
    const productId = String(entry?.productId || '').trim();
    const quantity = Number(entry?.quantity);

    assertCheckoutError(/^[A-Za-z0-9_-]{1,120}$/.test(productId), 'invalid_cart', 'Der Warenkorb enthaelt ungueltige Artikel.');
    assertCheckoutError(Number.isInteger(quantity) && quantity > 0, 'invalid_quantity', 'Mindestens eine Artikelmenge ist ungueltig.');
    assertCheckoutError(quantity <= ZOLLHAUS_CHECKOUT_MAX_QUANTITY_PER_ITEM, 'invalid_quantity', 'Mindestens eine Artikelmenge ist zu gross.');

    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  const normalized = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  const totalQuantity = normalized.reduce((sum, entry) => sum + entry.quantity, 0);
  assertCheckoutError(totalQuantity <= ZOLLHAUS_CHECKOUT_MAX_TOTAL_QUANTITY, 'cart_too_large', 'Der Warenkorb ist zu gross.');

  return normalized.sort((left, right) => left.productId.localeCompare(right.productId));
}

export function createZollhausOrderRequestHash(submission: ZollhausCheckoutSubmission) {
  const normalizedItems = normalizeCartItems(submission.items);
  const normalizedCustomer = normalizeOrderCustomerForCheckout(submission.customer);

  return createHash('sha256')
    .update(JSON.stringify({
      customer: normalizedCustomer,
      items: normalizedItems,
    }))
    .digest('hex');
}

function createCompletedOrderRequest(params: {
  idempotencyKey: string;
  requestHash: string;
  orderId: string;
  orderNumber: string;
  now: string;
}) {
  return normalizeZollhausOrderRequest({
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    status: 'completed',
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    createdAt: params.now,
    completedAt: params.now,
  });
}

export async function submitZollhausCheckout(
  submission: ZollhausCheckoutSubmission,
  options: {
    store: ZollhausCheckoutStore;
    now?: () => Date;
    createOrderId?: () => string;
    createOrderNumber?: (settings: ZollhausShopSettings, now: Date) => string;
  },
) {
  const nowDate = options.now?.() ?? new Date();
  const nowIso = nowDate.toISOString();
  const normalizedCustomer = normalizeOrderCustomerForCheckout(submission.customer);
  const normalizedItems = normalizeCartItems(submission.items);
  const idempotencyKey = String(submission.idempotencyKey || '').trim();

  assertCheckoutError(idempotencyKey.length >= 8 && idempotencyKey.length <= 200, 'invalid_request', 'Die Bestellung konnte nicht bestaetigt werden.');

  const requestHash = createZollhausOrderRequestHash({
    idempotencyKey,
    customer: normalizedCustomer,
    items: normalizedItems,
  });

  return options.store.runTransaction(async (transaction) => {
    const settings = normalizeCheckoutSettings(await transaction.getSettings(), nowIso);
    assertCheckoutError(settings.checkoutEnabled, 'checkout_disabled', 'Bestellungen auf Rechnung sind derzeit noch nicht freigeschaltet.');

    const existingRequest = await transaction.getOrderRequest(idempotencyKey);

    if (existingRequest) {
      assertCheckoutError(existingRequest.requestHash === requestHash, 'idempotency_conflict', 'Diese Bestellung wurde bereits mit anderen Daten gesendet.');
      assertCheckoutError(existingRequest.orderId, 'duplicate_request', 'Die Bestellung wird bereits verarbeitet.');

      const existingOrder = await transaction.getOrder(existingRequest.orderId);
      assertCheckoutError(existingOrder, 'duplicate_request', 'Die Bestellung wird bereits verarbeitet.');

      return {
        created: false,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        totalPriceCents: existingOrder.totalPriceCents,
        items: existingOrder.items,
      } satisfies ZollhausCheckoutResult;
    }

    const products = await transaction.getProducts(normalizedItems.map((entry) => entry.productId));

    const orderItems = normalizedItems.map((entry) => {
      const product = products.get(entry.productId) || null;

      assertCheckoutError(product, 'product_missing', 'Mindestens ein Artikel ist nicht mehr verfuegbar.');
      assertCheckoutError(product.status === 'active', 'product_archived', 'Mindestens ein Artikel ist nicht mehr verfuegbar.');
      assertCheckoutError(product.stockQuantity > 0, 'product_sold_out', 'Mindestens ein Artikel ist inzwischen ausverkauft.');
      assertCheckoutError(entry.quantity <= product.stockQuantity, 'insufficient_stock', 'Die gewuenschte Menge ist nicht mehr vollstaendig verfuegbar.');

      return {
        product,
        quantity: entry.quantity,
        item: buildZollhausOrderItemFromProduct(product, entry.quantity),
      };
    });

    const orderId = options.createOrderId?.() ?? randomUUID();
    const orderNumber = options.createOrderNumber?.(settings, nowDate)
      ?? generateZollhausOrderNumber({ now: nowDate, prefix: settings.orderNumberPrefix });
    const items = orderItems.map((entry) => entry.item);
    const totalPriceCents = calculateZollhausOrderTotal(items);

    const order = normalizeZollhausOrder({
      id: orderId,
      orderNumber,
      status: 'new',
      customer: normalizedCustomer,
      items,
      totalPriceCents,
      idempotencyKey,
      email: { state: 'pending', attemptCount: 0 },
      createdAt: nowIso,
    });

    for (const entry of orderItems) {
      const nextProduct = normalizeZollhausProduct(
        {
          ...entry.product,
          stockQuantity: entry.product.stockQuantity - entry.quantity,
        },
        { existing: entry.product, now: nowIso },
      );

      await transaction.saveProduct(nextProduct);
    }

    await transaction.createOrder(order);
    await transaction.createOrderRequest(createCompletedOrderRequest({
      idempotencyKey,
      requestHash,
      orderId: order.id,
      orderNumber: order.orderNumber,
      now: nowIso,
    }));

    return {
      created: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPriceCents: order.totalPriceCents,
      items: order.items,
    } satisfies ZollhausCheckoutResult;
  });
}