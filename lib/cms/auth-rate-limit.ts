import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseDb, hasFirebaseConfig } from './firebase';

export interface LoginAttemptRecord {
  key: string;
  failureCount: number;
  lockedUntil: number;
  updatedAt: number;
}

export interface LoginAttemptStore {
  get(key: string): Promise<LoginAttemptRecord | null>;
  set(record: LoginAttemptRecord): Promise<void>;
  delete(key: string): Promise<void>;
}

const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const LOCAL_STORE_PATH = path.join(process.cwd(), '.cms', 'admin-login-limits.json');

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

async function ensureLocalStoreDir() {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
}

async function readLocalRecords() {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, LoginAttemptRecord>;

    return parsed;
  } catch {
    return {} as Record<string, LoginAttemptRecord>;
  }
}

const fileLoginAttemptStore: LoginAttemptStore = {
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
  async delete(key) {
    await ensureLocalStoreDir();
    const records = await readLocalRecords();
    delete records[key];
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(records), 'utf8');
  },
};

const firestoreLoginAttemptStore: LoginAttemptStore = {
  async get(key) {
    const snapshot = await getFirebaseDb().collection('admin_login_limits').doc(key).get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as Partial<LoginAttemptRecord> | undefined;

    if (!data) {
      return null;
    }

    return {
      key,
      failureCount: Number(data.failureCount || 0),
      lockedUntil: Number(data.lockedUntil || 0),
      updatedAt: Number(data.updatedAt || 0),
    };
  },
  async set(record) {
    await getFirebaseDb().collection('admin_login_limits').doc(record.key).set(record, { merge: true });
  },
  async delete(key) {
    await getFirebaseDb().collection('admin_login_limits').doc(key).delete();
  },
};

function getLoginAttemptStore() {
  return hasFirebaseConfig() ? firestoreLoginAttemptStore : fileLoginAttemptStore;
}

export function createLoginAttemptKey(scope: string, username: string, clientIp: string, secret: string) {
  return createHash('sha256')
    .update(scope)
    .update(':')
    .update(username.trim().toLowerCase())
    .update(':')
    .update(normalizeClientIp(clientIp))
    .update(':')
    .update(secret)
    .digest('hex');
}

export async function getLoginThrottleState(store: LoginAttemptStore, key: string, now = Date.now()) {
  const record = await store.get(key);

  if (!record) {
    return { allowed: true, retryAfterSeconds: 0 } as const;
  }

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.lockedUntil - now) / 1000)),
    } as const;
  }

  return { allowed: true, retryAfterSeconds: 0 } as const;
}

export async function recordFailedLogin(store: LoginAttemptStore, key: string, now = Date.now()) {
  const existing = await store.get(key);
  const failureCount = (existing?.lockedUntil && existing.lockedUntil > now ? existing.failureCount : existing?.failureCount || 0) + 1;
  const lockedUntil = failureCount >= LOGIN_FAILURE_LIMIT ? now + LOGIN_LOCK_MS : 0;

  await store.set({
    key,
    failureCount,
    lockedUntil,
    updatedAt: now,
  });

  return {
    locked: lockedUntil > now,
    retryAfterSeconds: lockedUntil > now ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0,
  };
}

export async function clearLoginFailures(store: LoginAttemptStore, key: string) {
  await store.delete(key);
}

export async function assertZollhausLoginAllowed(username: string, clientIp: string, secret: string) {
  const key = createLoginAttemptKey('zollhaus-admin', username, clientIp, secret);
  const store = getLoginAttemptStore();
  const state = await getLoginThrottleState(store, key);

  return {
    ...state,
    key,
    store,
  };
}