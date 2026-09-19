import 'server-only';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseDb, hasFirebaseConfig } from '@/lib/cms/firebase';
import { submitZollhausCheckout, type ZollhausCheckoutStore, type ZollhausCheckoutTransaction } from '@/lib/zollhaus/checkout';
import { getLocalZollhausFixtureProducts } from '@/lib/zollhaus/public-fixtures';
import { buildDefaultZollhausShopSettings, getResolvedZollhausShopSettings } from '@/lib/zollhaus/settings';
import {
  ZOLLHAUS_ORDER_REQUESTS_COLLECTION_PATH,
  ZOLLHAUS_ORDERS_COLLECTION_PATH,
  ZOLLHAUS_PRODUCTS_COLLECTION_PATH,
  ZOLLHAUS_SETTINGS_DOCUMENT_PATH,
  type ZollhausOrder,
  type ZollhausOrderRequest,
  type ZollhausProduct,
  type ZollhausShopSettings,
} from '@/lib/zollhaus/types';
import { normalizeZollhausOrder, normalizeZollhausOrderRequest, normalizeZollhausProduct, normalizeZollhausShopSettings } from '@/lib/zollhaus/validation';

interface LocalCheckoutState {
  settings: ZollhausShopSettings;
  products: Record<string, ZollhausProduct>;
  orders: Record<string, ZollhausOrder>;
  orderRequests: Record<string, ZollhausOrderRequest>;
}

const LOCAL_CHECKOUT_STORE_PATH = '/tmp/zollhaus-local-checkout-store.json';
let localTransactionQueue = Promise.resolve();

function shouldUseLocalFixtures() {
  return process.env.ZOLLHAUS_LOCAL_FIXTURES === '1';
}

function mapFromRecord<T>(record: Record<string, T>) {
  return new Map(Object.entries(record));
}

function recordFromMap<T extends { id?: string; idempotencyKey?: string }>(map: Map<string, T>) {
  return Object.fromEntries(map.entries());
}

async function ensureLocalCheckoutDir() {
  await mkdir(path.dirname(LOCAL_CHECKOUT_STORE_PATH), { recursive: true });
}

function buildInitialLocalCheckoutState(): LocalCheckoutState {
  const products = Object.fromEntries(
    getLocalZollhausFixtureProducts().map((product) => [product.id, normalizeZollhausProduct(product, { existing: product })]),
  );

  return {
    settings: buildDefaultZollhausShopSettings(),
    products,
    orders: {},
    orderRequests: {},
  };
}

async function readLocalCheckoutState() {
  try {
    const raw = await readFile(LOCAL_CHECKOUT_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalCheckoutState>;
    const fallback = buildInitialLocalCheckoutState();

    return {
      settings: parsed.settings ? normalizeZollhausShopSettings(parsed.settings, { existing: parsed.settings }) : fallback.settings,
      products: Object.fromEntries(
        Object.entries(parsed.products || fallback.products).map(([id, product]) => [id, normalizeZollhausProduct(product, { existing: product as ZollhausProduct })]),
      ),
      orders: Object.fromEntries(
        Object.entries(parsed.orders || {}).map(([id, order]) => [id, normalizeZollhausOrder(order, {
          existing: order as ZollhausOrder,
          tolerateInvalidCustomerEmail: true,
        })]),
      ),
      orderRequests: Object.fromEntries(
        Object.entries(parsed.orderRequests || {}).map(([id, orderRequest]) => [id, normalizeZollhausOrderRequest(orderRequest, { existing: orderRequest as ZollhausOrderRequest })]),
      ),
    } satisfies LocalCheckoutState;
  } catch {
    return buildInitialLocalCheckoutState();
  }
}

async function writeLocalCheckoutState(state: LocalCheckoutState) {
  await ensureLocalCheckoutDir();
  await writeFile(LOCAL_CHECKOUT_STORE_PATH, JSON.stringify(state), 'utf8');
}

class LocalFixtureCheckoutStore implements ZollhausCheckoutStore {
  async runTransaction<T>(callback: (transaction: ZollhausCheckoutTransaction) => Promise<T>): Promise<T> {
    const previous = localTransactionQueue;
    let release = () => {};
    localTransactionQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    const state = await readLocalCheckoutState();
    const draftProducts = mapFromRecord(state.products);
    const draftOrders = mapFromRecord(state.orders);
    const draftOrderRequests = mapFromRecord(state.orderRequests);
    const settings = state.settings;

    const transaction: ZollhausCheckoutTransaction = {
      getSettings: async () => settings,
      getOrderRequest: async (idempotencyKey) => draftOrderRequests.get(idempotencyKey) || null,
      getOrder: async (orderId) => draftOrders.get(orderId) || null,
      listOrders: async () => [...draftOrders.values()],
      getProducts: async (productIds) => new Map(productIds.map((productId) => [productId, draftProducts.get(productId) || null])),
      saveProduct: async (product) => {
        draftProducts.set(product.id, product);
      },
      saveOrder: async (order) => {
        draftOrders.set(order.id, order);
      },
      createOrder: async (order) => {
        draftOrders.set(order.id, order);
      },
      createOrderRequest: async (orderRequest) => {
        draftOrderRequests.set(orderRequest.idempotencyKey, orderRequest);
      },
    };

    try {
      const result = await callback(transaction);
      await writeLocalCheckoutState({
        settings,
        products: recordFromMap(draftProducts),
        orders: recordFromMap(draftOrders),
        orderRequests: recordFromMap(draftOrderRequests),
      });
      release();
      return result;
    } catch (error) {
      release();
      throw error;
    }
  }
}

class FirestoreCheckoutStore implements ZollhausCheckoutStore {
  async runTransaction<T>(callback: (transaction: ZollhausCheckoutTransaction) => Promise<T>): Promise<T> {
    const db = getFirebaseDb();

    return db.runTransaction(async (firestoreTransaction) => {
      const transaction: ZollhausCheckoutTransaction = {
        getSettings: async () => {
          const snapshot = await firestoreTransaction.get(db.doc(ZOLLHAUS_SETTINGS_DOCUMENT_PATH));

          if (!snapshot.exists) {
            return buildDefaultZollhausShopSettings();
          }

          return normalizeZollhausShopSettings(snapshot.data() || {});
        },
        getOrderRequest: async (idempotencyKey) => {
          const snapshot = await firestoreTransaction.get(db.doc(`${ZOLLHAUS_ORDER_REQUESTS_COLLECTION_PATH}/${idempotencyKey}`));
          return snapshot.exists ? normalizeZollhausOrderRequest({ idempotencyKey: snapshot.id, ...(snapshot.data() || {}) }) : null;
        },
        getOrder: async (orderId) => {
          const snapshot = await firestoreTransaction.get(db.doc(`${ZOLLHAUS_ORDERS_COLLECTION_PATH}/${orderId}`));
          return snapshot.exists ? normalizeZollhausOrder({ id: snapshot.id, ...(snapshot.data() || {}) }, { tolerateInvalidCustomerEmail: true }) : null;
        },
        listOrders: async () => {
          const snapshot = await firestoreTransaction.get(db.collection(ZOLLHAUS_ORDERS_COLLECTION_PATH).orderBy('createdAt', 'desc'));
          return snapshot.docs.map((entry) => normalizeZollhausOrder({ id: entry.id, ...(entry.data() || {}) }, { tolerateInvalidCustomerEmail: true }));
        },
        getProducts: async (productIds) => {
          const refs = productIds.map((productId) => db.doc(`${ZOLLHAUS_PRODUCTS_COLLECTION_PATH}/${productId}`));
          const snapshots = await firestoreTransaction.getAll(...refs);

          return new Map(
            snapshots.map((snapshot) => [snapshot.id, snapshot.exists ? normalizeZollhausProduct({ id: snapshot.id, ...(snapshot.data() || {}) }) : null]),
          );
        },
        saveProduct: async (product) => {
          firestoreTransaction.set(db.doc(`${ZOLLHAUS_PRODUCTS_COLLECTION_PATH}/${product.id}`), product, { merge: false });
        },
        saveOrder: async (order) => {
          firestoreTransaction.set(db.doc(`${ZOLLHAUS_ORDERS_COLLECTION_PATH}/${order.id}`), order, { merge: false });
        },
        createOrder: async (order) => {
          firestoreTransaction.create(db.doc(`${ZOLLHAUS_ORDERS_COLLECTION_PATH}/${order.id}`), order);
        },
        createOrderRequest: async (orderRequest) => {
          firestoreTransaction.create(db.doc(`${ZOLLHAUS_ORDER_REQUESTS_COLLECTION_PATH}/${orderRequest.idempotencyKey}`), orderRequest);
        },
      };

      return callback(transaction);
    });
  }
}

export function getZollhausCheckoutStore() {
  if (shouldUseLocalFixtures()) {
    return new LocalFixtureCheckoutStore();
  }

  if (!hasFirebaseConfig()) {
    return new LocalFixtureCheckoutStore();
  }

  return new FirestoreCheckoutStore();
}

export async function submitPublicZollhausCheckout(parameters: Parameters<typeof submitZollhausCheckout>[0]) {
  return submitZollhausCheckout(parameters, {
    store: getZollhausCheckoutStore(),
  });
}

export async function getStoredZollhausOrderById(orderId: string) {
  const store = getZollhausCheckoutStore();

  return store.runTransaction(async (transaction) => transaction.getOrder(orderId));
}
