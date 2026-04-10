import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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

  if (!getApps().length) {
    initializeApp({
      credential: cert(config),
      projectId: config.projectId,
    });
  }

  return getFirestore();
}