import type { Firestore } from 'firebase-admin/firestore';
import { getFirebaseDb, hasFirebaseConfig } from '@/lib/cms/firebase';
import { getEventSponsoringCollectionName } from '@/lib/event-sponsoring/schema';
import { findOverlappingActiveSlots } from '@/lib/event-sponsoring/capacity';
import type {
  EventSponsoringBanner,
  EventSponsoringBooking,
  EventSponsoringConfig,
  EventSponsoringLogoUpload,
  EventSponsoringPackage,
  EventSponsoringPayment,
  EventSponsoringRequest,
  EventSponsoringSlot,
} from '@/lib/event-sponsoring/types';
import {
  assertMaxTwoActiveBannersPerEvent,
  normalizeEventSponsoringBanner,
  normalizeEventSponsoringBooking,
  normalizeEventSponsoringConfig,
  normalizeEventSponsoringLogoUpload,
  normalizeEventSponsoringPackage,
  normalizeEventSponsoringPayment,
  normalizeEventSponsoringRequest,
  normalizeEventSponsoringSlot,
} from '@/lib/event-sponsoring/validation';

function getDb(db?: Firestore) {
  return db ?? getFirebaseDb();
}

function assertFirebaseAvailable() {
  if (!hasFirebaseConfig()) {
    throw new Error('Event-Sponsoring erfordert eine konfigurierte Firestore-Verbindung.');
  }
}

function normalizeStoredDocumentId<T extends { id?: string; eventId?: string }>(snapshotId: string, data: T, label: 'id' | 'eventId') {
  const storedValue = typeof data[label] === 'string' ? data[label] : '';

  if (storedValue && storedValue !== snapshotId) {
    throw new Error(`Gespeicherte ${label === 'id' ? 'Dokument-ID' : 'Event-ID'} und Dokumentpfad stimmen nicht ueberein.`);
  }

  return snapshotId;
}

function getOptionalTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getOptionalStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean);
}

function getOptionalNonNegativeInteger(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function getOptionalBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

function normalizeLegacyPackageKind(value: unknown): EventSponsoringPackage['kind'] {
  const candidate = getOptionalTrimmedString(value);

  if (
    candidate === 'small_logo'
    || candidate === 'medium_logo'
    || candidate === 'large_logo'
    || candidate === 'custom_request'
    || candidate === 'anonymous_support'
  ) {
    return candidate;
  }

  throw new Error('Ungueltige Paketart in Legacy-Dokument.');
}

function getExpectedLegacyLogoSlotSize(kind: EventSponsoringPackage['kind']): EventSponsoringPackage['logoSlotSize'] {
  if (kind === 'small_logo') {
    return 'small';
  }

  if (kind === 'medium_logo') {
    return 'medium';
  }

  if (kind === 'large_logo') {
    return 'large';
  }

  return 'none';
}

function buildSafeEventSponsoringConfigDocument(snapshotId: string, data: Record<string, unknown>) {
  return {
    eventId: normalizeStoredDocumentId(snapshotId, data, 'eventId'),
    enabled: getOptionalBoolean(data.enabled, false),
    publicTitle: getOptionalTrimmedString(data.publicTitle) || 'Veranstaltungs-Sponsoring',
    publicDescription: getOptionalTrimmedString(data.publicDescription) || 'Weitere Informationen folgen.',
    currencyCode: getOptionalTrimmedString(data.currencyCode) || 'EUR',
    anonymousSupportEnabled: getOptionalBoolean(data.anonymousSupportEnabled, false),
    anonymousMinimumAmountCents: getOptionalNonNegativeInteger(data.anonymousMinimumAmountCents, 0),
    customSponsoringEnabled: getOptionalBoolean(data.customSponsoringEnabled, false),
    showOccupiedLogosPublicly: getOptionalBoolean(data.showOccupiedLogosPublicly, false),
    ...(getOptionalTrimmedString(data.createdAt) ? { createdAt: getOptionalTrimmedString(data.createdAt) } : {}),
    ...(getOptionalTrimmedString(data.updatedAt) ? { updatedAt: getOptionalTrimmedString(data.updatedAt) } : {}),
  } satisfies Partial<EventSponsoringConfig> & { eventId: string };
}

function buildSafeEventSponsoringPackageDocument(snapshotId: string, data: Record<string, unknown>) {
  const eventId = getOptionalTrimmedString(data.eventId);
  const kind = normalizeLegacyPackageKind(data.kind);

  if (!eventId) {
    throw new Error('Legacy-Paket ohne Veranstaltungs-ID kann nicht gelesen werden.');
  }

  return {
    id: normalizeStoredDocumentId(snapshotId, data, 'id'),
    eventId,
    name: getOptionalTrimmedString(data.name) || 'Sponsoringpaket',
    kind,
    description: getOptionalTrimmedString(data.description) || 'Weitere Informationen folgen.',
    features: getOptionalStringArray(data.features),
    priceCents: getOptionalNonNegativeInteger(data.priceCents, 0),
    currencyCode: getOptionalTrimmedString(data.currencyCode) || 'EUR',
    active: getOptionalBoolean(data.active, true),
    sortOrder: getOptionalNonNegativeInteger(data.sortOrder, 0),
    grantsBannerPlacement: kind === 'small_logo' || kind === 'medium_logo' || kind === 'large_logo',
    logoSlotSize: getExpectedLegacyLogoSlotSize(kind),
    isPaidOnline: kind !== 'custom_request',
    ...(getOptionalTrimmedString(data.createdAt) ? { createdAt: getOptionalTrimmedString(data.createdAt) } : {}),
    ...(getOptionalTrimmedString(data.updatedAt) ? { updatedAt: getOptionalTrimmedString(data.updatedAt) } : {}),
  } satisfies Partial<EventSponsoringPackage> & { id: string; eventId: string };
}

function normalizeEventSponsoringPackageDocumentOrNull(snapshotId: string, data: Record<string, unknown>) {
  try {
    return normalizeEventSponsoringPackage(buildSafeEventSponsoringPackageDocument(snapshotId, data));
  } catch {
    return null;
  }
}

type EventSponsoringDocument =
  | EventSponsoringConfig
  | EventSponsoringPackage
  | EventSponsoringBanner
  | EventSponsoringSlot
  | EventSponsoringBooking
  | EventSponsoringPayment
  | EventSponsoringRequest
  | EventSponsoringLogoUpload;

export interface EventSponsoringTransaction {
  getConfig(eventId: string): Promise<EventSponsoringConfig | null>;
  listPackages(eventId: string): Promise<EventSponsoringPackage[]>;
  getBanner(bannerId: string): Promise<EventSponsoringBanner | null>;
  listBanners(eventId: string): Promise<EventSponsoringBanner[]>;
  listSlotsByEvent(eventId: string): Promise<EventSponsoringSlot[]>;
  listSlotsByBanner(eventId: string, bannerId: string): Promise<EventSponsoringSlot[]>;
  getBooking(bookingId: string): Promise<EventSponsoringBooking | null>;
  getBookingByCheckoutIdempotencyKeyHash(checkoutIdempotencyKeyHash: string): Promise<EventSponsoringBooking | null>;
  listBookingsByEvent(eventId: string): Promise<EventSponsoringBooking[]>;
  getPayment(paymentId: string): Promise<EventSponsoringPayment | null>;
  getRequest(requestId: string): Promise<EventSponsoringRequest | null>;
  getRequestByIdempotencyKeyHash(idempotencyKeyHash: string): Promise<EventSponsoringRequest | null>;
  listRequestsByEvent(eventId: string): Promise<EventSponsoringRequest[]>;
  getLogoUpload(logoUploadId: string): Promise<EventSponsoringLogoUpload | null>;
  saveConfig(config: EventSponsoringConfig): Promise<void>;
  savePackage(pkg: EventSponsoringPackage): Promise<void>;
  saveBanner(banner: EventSponsoringBanner): Promise<void>;
  saveSlot(slot: EventSponsoringSlot): Promise<void>;
  deleteSlot(slotId: string): Promise<void>;
  saveBooking(booking: EventSponsoringBooking): Promise<void>;
  savePayment(payment: EventSponsoringPayment): Promise<void>;
  saveRequest(request: EventSponsoringRequest): Promise<void>;
  saveLogoUpload(logoUpload: EventSponsoringLogoUpload): Promise<void>;
}

export interface EventSponsoringStore {
  runTransaction<T>(callback: (transaction: EventSponsoringTransaction) => Promise<T>): Promise<T>;
}

function sortByOrderAndId<T extends { sortOrder: number; id: string }>(entries: T[]) {
  return [...entries].sort((left, right) => (left.sortOrder === right.sortOrder ? left.id.localeCompare(right.id) : left.sortOrder - right.sortOrder));
}

function sortByCreatedAtDesc<T extends { createdAt: string; id: string }>(entries: T[]) {
  return [...entries].sort((left, right) => (left.createdAt === right.createdAt ? left.id.localeCompare(right.id) : right.createdAt.localeCompare(left.createdAt)));
}

interface InMemoryState {
  configs: Map<string, EventSponsoringConfig>;
  packages: Map<string, EventSponsoringPackage>;
  banners: Map<string, EventSponsoringBanner>;
  slots: Map<string, EventSponsoringSlot>;
  bookings: Map<string, EventSponsoringBooking>;
  payments: Map<string, EventSponsoringPayment>;
  requests: Map<string, EventSponsoringRequest>;
  logoUploads: Map<string, EventSponsoringLogoUpload>;
}

function cloneMap<T>(input: Map<string, T>) {
  return new Map([...input.entries()].map(([key, value]) => [key, structuredClone(value)]));
}

function buildInMemoryState(initial?: Partial<Record<keyof InMemoryState, Array<EventSponsoringDocument>>>) {
  const state: InMemoryState = {
    configs: new Map(),
    packages: new Map(),
    banners: new Map(),
    slots: new Map(),
    bookings: new Map(),
    payments: new Map(),
    requests: new Map(),
    logoUploads: new Map(),
  };

  for (const config of (initial?.configs as EventSponsoringConfig[] | undefined) || []) {
    state.configs.set(config.eventId, structuredClone(config));
  }
  for (const pkg of (initial?.packages as EventSponsoringPackage[] | undefined) || []) {
    state.packages.set(pkg.id, structuredClone(pkg));
  }
  for (const banner of (initial?.banners as EventSponsoringBanner[] | undefined) || []) {
    state.banners.set(banner.id, structuredClone(banner));
  }
  for (const slot of (initial?.slots as EventSponsoringSlot[] | undefined) || []) {
    state.slots.set(slot.id, structuredClone(slot));
  }
  for (const booking of (initial?.bookings as EventSponsoringBooking[] | undefined) || []) {
    state.bookings.set(booking.id, structuredClone(booking));
  }
  for (const payment of (initial?.payments as EventSponsoringPayment[] | undefined) || []) {
    state.payments.set(payment.id, structuredClone(payment));
  }
  for (const request of (initial?.requests as EventSponsoringRequest[] | undefined) || []) {
    state.requests.set(request.id, structuredClone(request));
  }
  for (const logoUpload of (initial?.logoUploads as EventSponsoringLogoUpload[] | undefined) || []) {
    state.logoUploads.set(logoUpload.id, structuredClone(logoUpload));
  }

  return state;
}

function createMemoryTransaction(state: InMemoryState): EventSponsoringTransaction {
  async function listBanners(eventId: string) {
    return sortByOrderAndId([...state.banners.values()].filter((banner) => banner.eventId === eventId));
  }

  async function listSlotsByEvent(eventId: string) {
    return sortByOrderAndId([...state.slots.values()].filter((slot) => slot.eventId === eventId));
  }

  async function validateSlotIntegrity(slot: EventSponsoringSlot) {
    const siblings = [...state.slots.values()].filter((entry) => entry.bannerId === slot.bannerId && entry.id !== slot.id);
    const overlaps = findOverlappingActiveSlots([...siblings, slot]);

    if (overlaps.length > 0) {
      throw new Error('Aktive Slots eines Banners duerfen sich nicht ueberschneiden.');
    }
  }

  return {
    async getConfig(eventId) {
      return structuredClone(state.configs.get(eventId) || null);
    },
    async listPackages(eventId) {
      return sortByOrderAndId([...state.packages.values()].filter((pkg) => pkg.eventId === eventId));
    },
    async getBanner(bannerId) {
      return structuredClone(state.banners.get(bannerId) || null);
    },
    listBanners,
    listSlotsByEvent,
    async listSlotsByBanner(eventId, bannerId) {
      return sortByOrderAndId([...state.slots.values()].filter((slot) => slot.eventId === eventId && slot.bannerId === bannerId));
    },
    async getBooking(bookingId) {
      return structuredClone(state.bookings.get(bookingId) || null);
    },
    async getBookingByCheckoutIdempotencyKeyHash(checkoutIdempotencyKeyHash) {
      return structuredClone([...state.bookings.values()].find((booking) => booking.checkoutIdempotencyKeyHash === checkoutIdempotencyKeyHash) || null);
    },
    async listBookingsByEvent(eventId) {
      return sortByCreatedAtDesc([...state.bookings.values()].filter((booking) => booking.eventId === eventId));
    },
    async getPayment(paymentId) {
      return structuredClone(state.payments.get(paymentId) || null);
    },
    async getRequest(requestId) {
      return structuredClone(state.requests.get(requestId) || null);
    },
    async getRequestByIdempotencyKeyHash(idempotencyKeyHash) {
      return structuredClone([...state.requests.values()].find((request) => request.idempotencyKeyHash === idempotencyKeyHash) || null);
    },
    async listRequestsByEvent(eventId) {
      return sortByCreatedAtDesc([...state.requests.values()].filter((request) => request.eventId === eventId));
    },
    async getLogoUpload(logoUploadId) {
      return structuredClone(state.logoUploads.get(logoUploadId) || null);
    },
    async saveConfig(config) {
      state.configs.set(config.eventId, structuredClone(config));
    },
    async savePackage(pkg) {
      state.packages.set(pkg.id, structuredClone(pkg));
    },
    async saveBanner(banner) {
      const nextBanners = [...state.banners.values()].filter((entry) => entry.id !== banner.id);
      assertMaxTwoActiveBannersPerEvent([...nextBanners, banner], banner.eventId);
      state.banners.set(banner.id, structuredClone(banner));
    },
    async saveSlot(slot) {
      await validateSlotIntegrity(slot);
      state.slots.set(slot.id, structuredClone(slot));
    },
    async deleteSlot(slotId) {
      state.slots.delete(slotId);
    },
    async saveBooking(booking) {
      state.bookings.set(booking.id, structuredClone(booking));
    },
    async savePayment(payment) {
      state.payments.set(payment.id, structuredClone(payment));
    },
    async saveRequest(request) {
      state.requests.set(request.id, structuredClone(request));
    },
    async saveLogoUpload(logoUpload) {
      state.logoUploads.set(logoUpload.id, structuredClone(logoUpload));
    },
  };
}

export function createInMemoryEventSponsoringStore(initial?: Partial<Record<keyof InMemoryState, Array<EventSponsoringDocument>>>): EventSponsoringStore {
  let state = buildInMemoryState(initial);
  let transactionQueue = Promise.resolve();

  return {
    async runTransaction<T>(callback: (transaction: EventSponsoringTransaction) => Promise<T>) {
      const previous = transactionQueue;
      let release = () => {};
      transactionQueue = new Promise<void>((resolve) => {
        release = resolve;
      });

      await previous;

      const draft: InMemoryState = {
        configs: cloneMap(state.configs),
        packages: cloneMap(state.packages),
        banners: cloneMap(state.banners),
        slots: cloneMap(state.slots),
        bookings: cloneMap(state.bookings),
        payments: cloneMap(state.payments),
        requests: cloneMap(state.requests),
        logoUploads: cloneMap(state.logoUploads),
      };

      try {
        const result = await callback(createMemoryTransaction(draft));
        state = draft;
        release();
        return result;
      } catch (error) {
        release();
        throw error;
      }
    },
  };
}

class FirestoreEventSponsoringStore implements EventSponsoringStore {
  constructor(private readonly db?: Firestore) {}

  async runTransaction<T>(callback: (transaction: EventSponsoringTransaction) => Promise<T>): Promise<T> {
    assertFirebaseAvailable();
    const db = getDb(this.db);

    return db.runTransaction(async (firestoreTransaction) => {
      const readConfig = async (eventId: string) => {
        const snapshot = await firestoreTransaction.get(db.collection(getEventSponsoringCollectionName('configs')).doc(eventId));

        if (!snapshot.exists) {
          return null;
        }

        return normalizeEventSponsoringConfig({ eventId: snapshot.id, ...(snapshot.data() || {}) });
      };

      const listByEvent = async <T>(collectionName: Parameters<typeof getEventSponsoringCollectionName>[0], normalizer: (input: unknown) => T, eventId: string) => {
        const snapshot = await firestoreTransaction.get(
          db.collection(getEventSponsoringCollectionName(collectionName)).where('eventId', '==', eventId),
        );

        return snapshot.docs.map((entry) => normalizer({ id: entry.id, ...(entry.data() || {}) }));
      };

      const getById = async <T>(collectionName: Parameters<typeof getEventSponsoringCollectionName>[0], id: string, normalizer: (input: unknown) => T) => {
        const snapshot = await firestoreTransaction.get(db.collection(getEventSponsoringCollectionName(collectionName)).doc(id));

        if (!snapshot.exists) {
          return null;
        }

        return normalizer({ id: snapshot.id, ...(snapshot.data() || {}) });
      };

      return callback({
        getConfig: async (eventId) => {
          const snapshot = await firestoreTransaction.get(db.collection(getEventSponsoringCollectionName('configs')).doc(eventId));

          if (!snapshot.exists) {
            return null;
          }

          return normalizeEventSponsoringConfig(buildSafeEventSponsoringConfigDocument(snapshot.id, snapshot.data() || {}));
        },
        async listPackages(eventId) {
          const snapshot = await firestoreTransaction.get(
            db.collection(getEventSponsoringCollectionName('packages')).where('eventId', '==', eventId),
          );

          const packages = snapshot.docs
            .map((entry) => normalizeEventSponsoringPackageDocumentOrNull(entry.id, entry.data() || {}))
            .filter((entry): entry is EventSponsoringPackage => Boolean(entry));

          return sortByOrderAndId(packages);
        },
        async getBanner(bannerId) {
          return getById('banners', bannerId, (input) => normalizeEventSponsoringBanner(input));
        },
        async listBanners(eventId) {
          return sortByOrderAndId(await listByEvent('banners', (input) => normalizeEventSponsoringBanner(input), eventId));
        },
        async listSlotsByEvent(eventId) {
          return sortByOrderAndId(await listByEvent('slots', (input) => normalizeEventSponsoringSlot(input), eventId));
        },
        async listSlotsByBanner(eventId, bannerId) {
          const allSlots = await listByEvent('slots', (input) => normalizeEventSponsoringSlot(input), eventId);
          return sortByOrderAndId(allSlots.filter((slot) => slot.bannerId === bannerId));
        },
        async getBooking(bookingId) {
          return getById('bookings', bookingId, (input) => normalizeEventSponsoringBooking(input));
        },
        async getBookingByCheckoutIdempotencyKeyHash(checkoutIdempotencyKeyHash) {
          const snapshot = await firestoreTransaction.get(
            db.collection(getEventSponsoringCollectionName('bookings')).where('checkoutIdempotencyKeyHash', '==', checkoutIdempotencyKeyHash).limit(1),
          );

          const document = snapshot.docs[0];

          return document ? normalizeEventSponsoringBooking({ id: document.id, ...(document.data() || {}) }) : null;
        },
        async listBookingsByEvent(eventId) {
          return sortByCreatedAtDesc(await listByEvent('bookings', (input) => normalizeEventSponsoringBooking(input), eventId));
        },
        async getPayment(paymentId) {
          return getById('payments', paymentId, (input) => normalizeEventSponsoringPayment(input));
        },
        async getRequest(requestId) {
          return getById('requests', requestId, (input) => normalizeEventSponsoringRequest(input));
        },
        async getRequestByIdempotencyKeyHash(idempotencyKeyHash) {
          const snapshot = await firestoreTransaction.get(
            db.collection(getEventSponsoringCollectionName('requests')).where('idempotencyKeyHash', '==', idempotencyKeyHash).limit(1),
          );

          const document = snapshot.docs[0];

          return document ? normalizeEventSponsoringRequest({ id: document.id, ...(document.data() || {}) }) : null;
        },
        async listRequestsByEvent(eventId) {
          return sortByCreatedAtDesc(await listByEvent('requests', (input) => normalizeEventSponsoringRequest(input), eventId));
        },
        async getLogoUpload(logoUploadId) {
          return getById('logoUploads', logoUploadId, (input) => normalizeEventSponsoringLogoUpload(input));
        },
        async saveConfig(config) {
          const normalized = normalizeEventSponsoringConfig(config, { existing: config });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('configs')).doc(normalized.eventId), normalized, { merge: false });
        },
        async savePackage(pkg) {
          const normalized = normalizeEventSponsoringPackage(pkg, { existing: pkg });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('packages')).doc(normalized.id), normalized, { merge: false });
        },
        async saveBanner(banner) {
          const normalized = normalizeEventSponsoringBanner(banner, { existing: banner });
          const current = await listByEvent('banners', (input) => normalizeEventSponsoringBanner(input), normalized.eventId);
          assertMaxTwoActiveBannersPerEvent([...current.filter((entry) => entry.id !== normalized.id), normalized], normalized.eventId);
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('banners')).doc(normalized.id), normalized, { merge: false });
        },
        async saveSlot(slot) {
          const normalized = normalizeEventSponsoringSlot(slot, { existing: slot });
          const siblings = await listByEvent('slots', (input) => normalizeEventSponsoringSlot(input), normalized.eventId);
          const overlaps = findOverlappingActiveSlots([...siblings.filter((entry) => entry.id !== normalized.id), normalized]);

          if (overlaps.length > 0) {
            throw new Error('Aktive Slots eines Banners duerfen sich nicht ueberschneiden.');
          }

          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('slots')).doc(normalized.id), normalized, { merge: false });
        },
        async deleteSlot(slotId) {
          await firestoreTransaction.delete(db.collection(getEventSponsoringCollectionName('slots')).doc(slotId));
        },
        async saveBooking(booking) {
          const normalized = normalizeEventSponsoringBooking(booking, { existing: booking });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('bookings')).doc(normalized.id), normalized, { merge: false });
        },
        async savePayment(payment) {
          const normalized = normalizeEventSponsoringPayment(payment, { existing: payment });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('payments')).doc(normalized.id), normalized, { merge: false });
        },
        async saveRequest(request) {
          const normalized = normalizeEventSponsoringRequest(request, { existing: request });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('requests')).doc(normalized.id), normalized, { merge: false });
        },
        async saveLogoUpload(logoUpload) {
          const normalized = normalizeEventSponsoringLogoUpload(logoUpload, { existing: logoUpload });
          await firestoreTransaction.set(db.collection(getEventSponsoringCollectionName('logoUploads')).doc(normalized.id), normalized, { merge: false });
        },
      });
    });
  }
}

export function getEventSponsoringStore(options?: { db?: Firestore }): EventSponsoringStore {
  return new FirestoreEventSponsoringStore(options?.db);
}

export async function getEventSponsoringConfigByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getConfig(eventId));
}

export async function listEventSponsoringPackagesByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listPackages(eventId));
}

export async function listEventSponsoringBannersByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listBanners(eventId));
}

export async function getEventSponsoringBannerById(bannerId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getBanner(bannerId));
}

export async function listEventSponsoringSlotsByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listSlotsByEvent(eventId));
}

export async function listEventSponsoringBookingsByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listBookingsByEvent(eventId));
}

export async function listEventSponsoringSlotsByBannerId(eventId: string, bannerId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listSlotsByBanner(eventId, bannerId));
}

export async function getEventSponsoringBookingById(bookingId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getBooking(bookingId));
}

export async function getEventSponsoringPaymentById(paymentId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getPayment(paymentId));
}

export async function getEventSponsoringRequestById(requestId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getRequest(requestId));
}

export async function getEventSponsoringRequestByIdempotencyKeyHash(idempotencyKeyHash: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getRequestByIdempotencyKeyHash(idempotencyKeyHash));
}

export async function listEventSponsoringRequestsByEventId(eventId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.listRequestsByEvent(eventId));
}

export async function getEventSponsoringLogoUploadById(logoUploadId: string, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction((transaction) => transaction.getLogoUpload(logoUploadId));
}

export async function saveEventSponsoringConfig(config: EventSponsoringConfig, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveConfig(config);
  });
}

export async function saveEventSponsoringPackage(pkg: EventSponsoringPackage, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.savePackage(pkg);
  });
}

export async function saveEventSponsoringBanner(banner: EventSponsoringBanner, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveBanner(banner);
  });
}

export async function saveEventSponsoringSlot(slot: EventSponsoringSlot, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveSlot(slot);
  });
}

export async function saveEventSponsoringBooking(booking: EventSponsoringBooking, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveBooking(booking);
  });
}

export async function saveEventSponsoringPayment(payment: EventSponsoringPayment, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.savePayment(payment);
  });
}

export async function saveEventSponsoringRequest(request: EventSponsoringRequest, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveRequest(request);
  });
}

export async function saveEventSponsoringLogoUpload(logoUpload: EventSponsoringLogoUpload, options?: { store?: EventSponsoringStore }) {
  const store = options?.store ?? getEventSponsoringStore();
  return store.runTransaction(async (transaction) => {
    await transaction.saveLogoUpload(logoUpload);
  });
}

export function normalizeEventSponsoringConfigDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringConfig(buildSafeEventSponsoringConfigDocument(snapshotId, data));
}

export function normalizeEventSponsoringPackageDocument(snapshotId: string, data: Record<string, unknown>) {
  const candidate = buildSafeEventSponsoringPackageDocument(snapshotId, data);
  const now = new Date().toISOString();

  return {
    id: candidate.id,
    eventId: candidate.eventId,
    name: candidate.name || 'Sponsoringpaket',
    kind: candidate.kind,
    description: candidate.description || 'Weitere Informationen folgen.',
    features: Array.isArray(candidate.features) ? candidate.features : [],
    priceCents: typeof candidate.priceCents === 'number' ? candidate.priceCents : 0,
    currencyCode: candidate.currencyCode || 'EUR',
    active: typeof candidate.active === 'boolean' ? candidate.active : true,
    sortOrder: typeof candidate.sortOrder === 'number' ? candidate.sortOrder : 0,
    grantsBannerPlacement: Boolean(candidate.grantsBannerPlacement),
    logoSlotSize: candidate.logoSlotSize || 'none',
    isPaidOnline: typeof candidate.isPaidOnline === 'boolean' ? candidate.isPaidOnline : candidate.kind !== 'custom_request',
    createdAt: candidate.createdAt || now,
    updatedAt: candidate.updatedAt || candidate.createdAt || now,
  } satisfies EventSponsoringPackage;
}

export function normalizeEventSponsoringBannerDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringBanner({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}

export function normalizeEventSponsoringSlotDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringSlot({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}

export function normalizeEventSponsoringBookingDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringBooking({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}

export function normalizeEventSponsoringPaymentDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringPayment({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}

export function normalizeEventSponsoringRequestDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringRequest({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}

export function normalizeEventSponsoringLogoUploadDocument(snapshotId: string, data: Record<string, unknown>) {
  return normalizeEventSponsoringLogoUpload({ id: normalizeStoredDocumentId(snapshotId, data, 'id'), ...data });
}
