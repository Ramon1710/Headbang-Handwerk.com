import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const INVALID_FIREBASE_CONFIG_ERROR = 'CMS_INVALID_FIREBASE_CONFIG';

function normalizePrivateKey(value?: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/^"|"$/g, '');

  return trimmed
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
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