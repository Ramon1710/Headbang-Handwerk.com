import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const INVALID_FIREBASE_CONFIG_ERROR = 'CMS_INVALID_FIREBASE_CONFIG';
const FIREBASE_AUTH_ERROR = 'CMS_FIREBASE_AUTH_ERROR';

function normalizeValue(value?: string) {
  if (!value) {
    return null;
  }

  return value.trim().replace(/^"|"$/g, '');
}

function normalizePrivateKey(value?: string) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function normalizeStorageBucket(value?: string) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^gs:\/\//, '')
    .replace(/^https?:\/\/storage.googleapis.com\//, '')
    .replace(/^https?:\/\/firebasestorage.googleapis.com\/v0\/b\//, '')
    .replace(/\/.*$/, '');
}

function getFirebaseConfig() {
  const projectId = normalizeValue(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = normalizeValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function hasFirebaseConfig() {
  return Boolean(getFirebaseConfig());
}

export function getFirebaseStorageBucketCandidates() {
  const explicitBucket = normalizeStorageBucket(process.env.FIREBASE_STORAGE_BUCKET);

  if (explicitBucket) {
    return [explicitBucket];
  }

  const projectId = normalizeValue(process.env.FIREBASE_PROJECT_ID);

  if (!projectId) {
    return [];
  }

  return Array.from(new Set([`${projectId}.appspot.com`, `${projectId}.firebasestorage.app`]));
}

export function getFirebaseDb() {
  const config = getFirebaseConfig();

  if (!config) {
    throw new Error('Firebase ist nicht vollständig konfiguriert.');
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert(config),
        projectId: config.projectId,
        storageBucket: normalizeStorageBucket(process.env.FIREBASE_STORAGE_BUCKET) || undefined,
      });
    }

    return getFirestore();
  } catch {
    throw new Error(INVALID_FIREBASE_CONFIG_ERROR);
  }
}

export function isInvalidFirebaseConfigError(error: unknown) {
  return error instanceof Error && error.message === INVALID_FIREBASE_CONFIG_ERROR;
}

export function isFirebaseAuthError(error: unknown) {
  if (error instanceof Error && error.message === FIREBASE_AUTH_ERROR) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? error.code : undefined;
  const maybeDetails = 'details' in error ? error.details : undefined;

  return (
    maybeCode === 16 ||
    maybeCode === '16' ||
    maybeCode === 'UNAUTHENTICATED' ||
    (typeof maybeDetails === 'string' && maybeDetails.toLowerCase().includes('invalid authentication credentials'))
  );
}

export function toFirebaseAuthError() {
  return new Error(FIREBASE_AUTH_ERROR);
}