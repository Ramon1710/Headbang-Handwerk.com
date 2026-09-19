import type { ZollhausCheckoutStore } from '@/lib/zollhaus/checkout';
import { normalizeZollhausOrder, normalizeZollhausProduct } from '@/lib/zollhaus/validation';
import type {
  ZollhausAdminActorRole,
  ZollhausManagedOrderStatus,
  ZollhausOrder,
  ZollhausOrderEmailState,
  ZollhausOrderStatus,
} from '@/lib/zollhaus/types';

export type ZollhausOrderListFilter = 'all' | 'new' | 'invoiced' | 'shipped' | 'cancelled' | 'email-open' | 'email-failed';

export interface ZollhausAdminActor {
  username: string;
  role: ZollhausAdminActorRole;
}

export const ZOLLHAUS_ADMIN_ORDER_PAGE_SIZE = 10;
export const ZOLLHAUS_MANAGED_ORDER_STATUSES: ZollhausManagedOrderStatus[] = ['new', 'invoiced', 'shipped', 'cancelled'];
export const ZOLLHAUS_ORDER_FILTERS: Array<{ value: ZollhausOrderListFilter; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Neu' },
  { value: 'invoiced', label: 'Rechnung erstellt' },
  { value: 'shipped', label: 'Versendet' },
  { value: 'cancelled', label: 'Storniert' },
  { value: 'email-open', label: 'E-Mail offen' },
  { value: 'email-failed', label: 'E-Mail fehlgeschlagen' },
];

async function resolveStore(store?: ZollhausCheckoutStore) {
  if (store) {
    return store;
  }

  const module = await import('@/lib/zollhaus/checkout-store');
  return module.getZollhausCheckoutStore();
}

function sortOrdersDesc(orders: ZollhausOrder[]) {
  return [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function isValidZollhausOrderId(value: string) {
  return /^[A-Za-z0-9_-]{8,120}$/.test(String(value || '').trim());
}

export function getZollhausOrderStatusLabel(status: ZollhausOrderStatus) {
  switch (status) {
    case 'new':
      return 'Neu';
    case 'invoiced':
      return 'Rechnung erstellt';
    case 'shipped':
      return 'Versendet';
    case 'cancelled':
      return 'Storniert';
    case 'email_sent':
      return 'Neu';
    case 'email_failed':
      return 'Neu';
    default:
      return 'Unbekannt';
  }
}

export function getZollhausOrderEmailStatusLabel(state: ZollhausOrderEmailState) {
  switch (state) {
    case 'pending':
      return 'Offen';
    case 'sending':
      return 'Wird versendet';
    case 'sent':
      return 'Versendet';
    case 'failed':
      return 'Fehlgeschlagen';
    default:
      return 'Unbekannt';
  }
}

export function isManagedZollhausOrderStatus(value: string): value is ZollhausManagedOrderStatus {
  return ZOLLHAUS_MANAGED_ORDER_STATUSES.includes(value as ZollhausManagedOrderStatus);
}

export function matchesZollhausOrderFilter(order: ZollhausOrder, filter: ZollhausOrderListFilter) {
  switch (filter) {
    case 'all':
      return true;
    case 'new':
      return order.status === 'new' || order.status === 'email_sent' || order.status === 'email_failed';
    case 'invoiced':
      return order.status === 'invoiced';
    case 'shipped':
      return order.status === 'shipped';
    case 'cancelled':
      return order.status === 'cancelled';
    case 'email-open':
      return order.email.state === 'pending' || order.email.state === 'sending'
        || order.customerEmail.state === 'pending' || order.customerEmail.state === 'sending';
    case 'email-failed':
      return order.email.state === 'failed' || order.customerEmail.state === 'failed';
    default:
      return true;
  }
}

export async function listZollhausManagedOrders(options?: { store?: ZollhausCheckoutStore }) {
  const store = await resolveStore(options?.store);
  const orders = await store.runTransaction(async (transaction) => transaction.listOrders());
  return sortOrdersDesc(orders);
}

export async function getZollhausManagedOrderById(orderId: string, options?: { store?: ZollhausCheckoutStore }) {
  if (!isValidZollhausOrderId(orderId)) {
    return null;
  }

  const store = await resolveStore(options?.store);
  return store.runTransaction(async (transaction) => transaction.getOrder(orderId));
}

export async function updateZollhausManagedOrderStatus(
  orderId: string,
  status: string,
  actor: ZollhausAdminActor,
  options?: { store?: ZollhausCheckoutStore; now?: () => Date },
) {
  if (!isValidZollhausOrderId(orderId)) {
    throw new Error('Die Bestellung wurde nicht gefunden.');
  }

  if (!isManagedZollhausOrderStatus(status)) {
    throw new Error('Der Bestellstatus ist ungueltig.');
  }

  const store = await resolveStore(options?.store);
  const nowIso = (options?.now?.() ?? new Date()).toISOString();

  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);

    if (!order) {
      throw new Error('Die Bestellung wurde nicht gefunden.');
    }

    if (order.status === 'cancelled' && status !== 'cancelled') {
      throw new Error('Stornierte Bestellungen koennen nicht wieder in einen aktiven Status gesetzt werden.');
    }

    if (order.stockRestoredAt && status !== 'cancelled') {
      throw new Error('Eine Bestellung mit zurueckgebuchtem Bestand muss storniert bleiben.');
    }

    const nextOrder = normalizeZollhausOrder(
      {
        ...order,
        status,
        statusUpdatedAt: nowIso,
        statusUpdatedBy: actor.username,
        statusUpdatedByRole: actor.role,
        ...(status === 'cancelled' ? { cancelledAt: order.cancelledAt || nowIso } : {}),
      },
      { existing: order, now: nowIso, tolerateInvalidCustomerEmail: true },
    );

    await transaction.saveOrder(nextOrder);
    return nextOrder;
  });
}

export async function retryFailedOrPendingZollhausOrderEmail(
  orderId: string,
  actor: ZollhausAdminActor,
  options?: {
    store?: ZollhausCheckoutStore;
    now?: () => Date;
    transport?: {
      send(input: {
        to: string;
        subject: string;
        text: string;
        html: string;
        messageId: string;
        headers: Record<string, string>;
      }): Promise<{ messageId?: string | null }>;
    };
  },
) {
  const order = await getZollhausManagedOrderById(orderId, { store: options?.store });

  if (!order) {
    throw new Error('Die Bestellung wurde nicht gefunden.');
  }

  if (order.email.state === 'sent') {
    throw new Error('Die interne Bestellmail wurde bereits erfolgreich versendet.');
  }

  if (order.email.state === 'sending') {
    throw new Error('Die interne Bestellmail wird bereits versendet.');
  }

  void actor;

  const module = await import('@/lib/zollhaus/order-email');
  return module.retryZollhausOrderEmail(orderId, { store: options?.store, now: options?.now, transport: options?.transport });
}

export async function retryFailedOrPendingZollhausCustomerOrderEmail(
  orderId: string,
  actor: ZollhausAdminActor,
  options?: {
    store?: ZollhausCheckoutStore;
    now?: () => Date;
    transport?: {
      send(input: {
        to: string;
        subject: string;
        text: string;
        html: string;
        from?: string;
        replyTo?: string;
        messageId: string;
        headers: Record<string, string>;
      }): Promise<{ messageId?: string | null }>;
    };
  },
) {
  const order = await getZollhausManagedOrderById(orderId, { store: options?.store });

  if (!order) {
    throw new Error('Die Bestellung wurde nicht gefunden.');
  }

  if (order.customerEmail.state === 'sent') {
    throw new Error('Die Kundenbestätigung wurde bereits erfolgreich versendet.');
  }

  if (order.customerEmail.state === 'sending') {
    throw new Error('Die Kundenbestätigung wird bereits versendet.');
  }

  void actor;

  const module = await import('@/lib/zollhaus/order-email');
  return module.retryZollhausCustomerOrderConfirmation(orderId, { store: options?.store, now: options?.now, transport: options?.transport });
}

export async function restoreZollhausOrderStock(
  orderId: string,
  actor: ZollhausAdminActor,
  options?: { store?: ZollhausCheckoutStore; now?: () => Date },
) {
  if (!isValidZollhausOrderId(orderId)) {
    throw new Error('Die Bestellung wurde nicht gefunden.');
  }

  const store = await resolveStore(options?.store);
  const nowIso = (options?.now?.() ?? new Date()).toISOString();

  return store.runTransaction(async (transaction) => {
    const order = await transaction.getOrder(orderId);

    if (!order) {
      throw new Error('Die Bestellung wurde nicht gefunden.');
    }

    if (order.status !== 'cancelled') {
      throw new Error('Bestand darf nur bei stornierten Bestellungen zurueckgebucht werden.');
    }

    if (order.stockRestoredAt) {
      throw new Error('Der Bestand wurde fuer diese Bestellung bereits zurueckgebucht.');
    }

    const quantities = new Map<string, number>();

    for (const item of order.items) {
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }

    const products = await transaction.getProducts([...quantities.keys()]);

    for (const productId of quantities.keys()) {
      if (!products.get(productId)) {
        throw new Error('Mindestens ein bestelltes Produkt existiert nicht mehr. Die Rueckbuchung wurde abgebrochen.');
      }
    }

    for (const [productId, quantity] of quantities.entries()) {
      const product = products.get(productId)!;
      const nextProduct = normalizeZollhausProduct(
        {
          ...product,
          stockQuantity: product.stockQuantity + quantity,
        },
        { existing: product, now: nowIso },
      );

      await transaction.saveProduct(nextProduct);
    }

    const nextOrder = normalizeZollhausOrder(
      {
        ...order,
        stockRestoredAt: nowIso,
        stockRestoredBy: actor.username,
        stockRestoredByRole: actor.role,
      },
      { existing: order, now: nowIso },
    );

    await transaction.saveOrder(nextOrder);
    return nextOrder;
  });
}

export async function hasZollhausProductOrderReference(productId: string, options?: { store?: ZollhausCheckoutStore }) {
  const store = await resolveStore(options?.store);
  const orders = await listZollhausManagedOrders({ store });
  return orders.some((order) => order.items.some((item) => item.productId === productId));
}