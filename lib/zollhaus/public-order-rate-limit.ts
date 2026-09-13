import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseDb, hasFirebaseConfig } from '@/lib/cms/firebase';

interface PublicOrderRateLimitRecord {
  key: string;
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
  updatedAt: number;
}

interface PublicOrderRateLimitStore {
  get(key: string): Promise<PublicOrderRateLimitRecord | null>;
  set(record: PublicOrderRateLimitRecord): Promise<void>;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;
const LOCAL_STORE_PATH = path.join(process.cwd(), '.cms', 'zollhaus-order-limits.json');

function normalizeClientIp(ip: string) {
  const normalized = ip.trim();

  if (!normalized) {
    return 'unknown';
  }

  if (normalized.includes('.')) {
    return normalized.split('.').slice(0, 3).join('.');
  }

  return normalized.split(':').slice(0, 4).join(':');
}

function getRateLimitSecret() {
  return process.env.ZOLLHAUS_ORDER_RATE_LIMIT_SECRET || process.env.ADMIN_SESSION_SECRET || 'zollhaus-order-limit-local-secret';
}

async function ensureLocalStoreDir() {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
}

async function readLocalRecords() {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, PublicOrderRateLimitRecord>;
  } catch {
    return {} as Record<string, PublicOrderRateLimitRecord>;
  }
}

const fileStore: PublicOrderRateLimitStore = {
  async get(key) {
    const records = await readLocalRecords();
    return records[key] || null;
  },
  async set(record) {
    await ensureLocalStoreDir();
    const records = await readLocalRecords();
    records[record.key] = record;
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(records), 'utf8');
  },
};

const firestoreStore: PublicOrderRateLimitStore = {
  async get(key) {
    const snapshot = await getFirebaseDb().collection('zollhaus_public_order_limits').doc(key).get();
    return snapshot.exists ? ({ key, ...(snapshot.data() || {}) } as PublicOrderRateLimitRecord) : null;
  },
  async set(record) {
    await getFirebaseDb().collection('zollhaus_public_order_limits').doc(record.key).set(record, { merge: true });
  },
};

function getStore() {
  return hasFirebaseConfig() ? firestoreStore : fileStore;
}

export function getPublicOrderClientIp(request: Request) {
  return String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0]?.trim() || 'unknown';
}

function createKey(clientIp: string) {
  return createHash('sha256').update(normalizeClientIp(clientIp)).update(':').update(getRateLimitSecret()).digest('hex');
}

export async function assertZollhausOrderAllowed(clientIp: string, now = Date.now()) {
  const key = createKey(clientIp);
  const store = getStore();
  const record = await store.get(key);

  if (record?.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.blockedUntil - now) / 1000)),
      key,
      store,
    } as const;
  }

  return { allowed: true, retryAfterSeconds: 0, key, store } as const;
}

export async function recordZollhausOrderAttempt(store: PublicOrderRateLimitStore, key: string, now = Date.now()) {
  const current = await store.get(key);
  const windowStartedAt = current && now - current.windowStartedAt < WINDOW_MS ? current.windowStartedAt : now;
  const count = current && now - current.windowStartedAt < WINDOW_MS ? current.count + 1 : 1;
  const blockedUntil = count > MAX_REQUESTS_PER_WINDOW ? now + WINDOW_MS : 0;

  await store.set({
    key,
    count,
    windowStartedAt,
    blockedUntil,
    updatedAt: now,
  });
}