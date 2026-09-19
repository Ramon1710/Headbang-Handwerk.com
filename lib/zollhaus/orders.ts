import 'server-only';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirebaseDb } from '@/lib/cms/firebase';
import { generateZollhausOrderNumber } from '@/lib/zollhaus/order-number';
import {
  normalizeZollhausOrder,
  normalizeZollhausOrderRequest,
} from '@/lib/zollhaus/validation';
import {
  ZOLLHAUS_PARTNER_SITE_ID,
  type ZollhausOrder,
  type ZollhausOrderRequest,
  type ZollhausOrderStatus,
} from '@/lib/zollhaus/types';

function getDb(db?: Firestore) {
  return db ?? getFirebaseDb();
}

function getSiteDocument(db?: Firestore) {
  return getDb(db).collection('partnerSites').doc(ZOLLHAUS_PARTNER_SITE_ID);
}

function getOrdersCollection(db?: Firestore) {
  return getSiteDocument(db).collection('orders');
}

function getOrderRequestsCollection(db?: Firestore) {
  return getSiteDocument(db).collection('orderRequests');
}

function readOrderSnapshot(snapshot: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return normalizeZollhausOrder({ id: snapshot.id, ...(snapshot.data() || {}) }, { tolerateInvalidCustomerEmail: true });
}

function readOrderRequestSnapshot(snapshot: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return normalizeZollhausOrderRequest({ idempotencyKey: snapshot.id, ...(snapshot.data() || {}) });
}

export async function listZollhausOrders(options?: { status?: ZollhausOrderStatus; limit?: number; db?: Firestore }) {
  let query: FirebaseFirestore.Query = getOrdersCollection(options?.db).orderBy('createdAt', 'desc');

  if (options?.status) {
    query = query.where('status', '==', options.status);
  }

  if (typeof options?.limit === 'number') {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  return snapshot.docs
    .map((entry) => readOrderSnapshot(entry))
    .filter((entry): entry is ZollhausOrder => Boolean(entry));
}

export async function getZollhausOrder(orderId: string, db?: Firestore) {
  const snapshot = await getOrdersCollection(db).doc(orderId).get();
  return readOrderSnapshot(snapshot);
}

export async function getZollhausOrderByNumber(orderNumber: string, db?: Firestore) {
  const snapshot = await getOrdersCollection(db).where('orderNumber', '==', orderNumber).limit(1).get();
  const first = snapshot.docs[0];

  return first ? readOrderSnapshot(first) : null;
}

export async function isZollhausOrderNumberAvailable(orderNumber: string, db?: Firestore) {
  const existing = await getZollhausOrderByNumber(orderNumber, db);
  return existing === null;
}

export async function allocateZollhausOrderNumber(options?: {
  db?: Firestore;
  attempts?: number;
  now?: Date | number | string;
  prefix?: string;
}) {
  const maxAttempts = Math.max(1, options?.attempts ?? 12);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const orderNumber = generateZollhausOrderNumber({ now: options?.now, prefix: options?.prefix });

    if (await isZollhausOrderNumberAvailable(orderNumber, options?.db)) {
      return orderNumber;
    }
  }

  throw new Error('Es konnte keine freie Zollhaus-Bestellnummer erzeugt werden.');
}

export async function createZollhausOrder(input: Omit<ZollhausOrder, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, db?: Firestore) {
  const collection = getOrdersCollection(db);
  const document = input.id ? collection.doc(input.id) : collection.doc();
  const order = normalizeZollhausOrder({
    ...input,
    id: document.id,
    createdAt: new Date().toISOString(),
  });

  await document.set(order, { merge: false });
  return order;
}

export async function updateZollhausOrderStatus(
  orderId: string,
  status: ZollhausOrderStatus,
  options?: { cancelledAt?: string; stockRestoredAt?: string; db?: Firestore }
) {
  const current = await getZollhausOrder(orderId, options?.db);

  if (!current) {
    throw new Error('Zollhaus-Bestellung wurde nicht gefunden.');
  }

  const next = normalizeZollhausOrder(
    {
      ...current,
      status,
      ...(options?.cancelledAt ? { cancelledAt: options.cancelledAt } : {}),
      ...(options?.stockRestoredAt ? { stockRestoredAt: options.stockRestoredAt } : {}),
    },
    { existing: current, tolerateInvalidCustomerEmail: true },
  );

  await getOrdersCollection(options?.db).doc(orderId).set(next, { merge: false });
  return next;
}

export async function getZollhausOrderRequest(idempotencyKey: string, db?: Firestore) {
  const snapshot = await getOrderRequestsCollection(db).doc(idempotencyKey).get();
  return readOrderRequestSnapshot(snapshot);
}

export async function beginZollhausOrderRequest(
  input: Pick<ZollhausOrderRequest, 'idempotencyKey' | 'requestHash'>,
  db?: Firestore,
) {
  const requestRef = getOrderRequestsCollection(db).doc(input.idempotencyKey);

  return getDb(db).runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    const existing = readOrderRequestSnapshot(snapshot);

    if (existing) {
      return existing;
    }

    const next = normalizeZollhausOrderRequest({
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: 'started',
      createdAt: new Date().toISOString(),
    });

    transaction.create(requestRef, next);
    return next;
  });
}

export async function completeZollhausOrderRequest(
  idempotencyKey: string,
  result: Pick<ZollhausOrderRequest, 'requestHash' | 'orderId' | 'orderNumber'>,
  db?: Firestore,
) {
  const current = await getZollhausOrderRequest(idempotencyKey, db);
  const next = normalizeZollhausOrderRequest(
    {
      idempotencyKey,
      requestHash: result.requestHash,
      status: 'completed',
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      completedAt: new Date().toISOString(),
    },
    { existing: current || undefined },
  );

  await getOrderRequestsCollection(db).doc(idempotencyKey).set(next, { merge: false });
  return next;
}

export async function failZollhausOrderRequest(
  idempotencyKey: string,
  result: Pick<ZollhausOrderRequest, 'requestHash'> & { lastError: string },
  db?: Firestore,
) {
  const current = await getZollhausOrderRequest(idempotencyKey, db);
  const next = normalizeZollhausOrderRequest(
    {
      idempotencyKey,
      requestHash: result.requestHash,
      status: 'failed',
      lastError: result.lastError,
    },
    { existing: current || undefined },
  );

  await getOrderRequestsCollection(db).doc(idempotencyKey).set(next, { merge: false });
  return next;
}
