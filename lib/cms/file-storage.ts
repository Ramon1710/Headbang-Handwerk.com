import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { getStorage } from 'firebase-admin/storage';
import {
  getFirebaseDb,
  getFirebaseStorageBucketCandidates,
  hasFirebaseConfig,
  isFirebaseAuthError,
  toFirebaseAuthError,
} from './firebase';

const FIREBASE_STORAGE_UPLOAD_ERROR = 'CMS_FIREBASE_STORAGE_UPLOAD';
const FIREBASE_STORAGE_BUCKET_NOT_FOUND_ERROR = 'CMS_FIREBASE_STORAGE_BUCKET_NOT_FOUND';
const FIREBASE_STORAGE_PERMISSION_ERROR = 'CMS_FIREBASE_STORAGE_PERMISSION';

function createFirebaseDownloadUrl(bucketName: string, objectName: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
}

function isFirebaseStorageBucketNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? error.code : undefined;
  const maybeMessage = 'message' in error ? error.message : undefined;

  return (
    maybeCode === 404 ||
    maybeCode === '404' ||
    (typeof maybeMessage === 'string' && /bucket|not found|does not exist/i.test(maybeMessage))
  );
}

function isFirebaseStoragePermissionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? error.code : undefined;
  const maybeMessage = 'message' in error ? error.message : undefined;

  return (
    maybeCode === 403 ||
    maybeCode === '403' ||
    maybeCode === 7 ||
    maybeCode === '7' ||
    maybeCode === 'PERMISSION_DENIED' ||
    (typeof maybeMessage === 'string' && /permission|access denied|insufficient/i.test(maybeMessage))
  );
}

function toFirebaseStorageUploadError(error: unknown) {
  if (isFirebaseStorageBucketNotFoundError(error)) {
    return new Error(FIREBASE_STORAGE_BUCKET_NOT_FOUND_ERROR);
  }

  if (isFirebaseStoragePermissionError(error)) {
    return new Error(FIREBASE_STORAGE_PERMISSION_ERROR);
  }

  return new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
}

function sanitizeFilename(filename: string) {
  return filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function uploadCmsAsset(file: File, folder: string, fallbackName: string) {
  if (!hasFirebaseConfig()) {
    throw new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
  }

  getFirebaseDb();

  const buckets = getFirebaseStorageBucketCandidates();

  if (!buckets.length) {
    throw new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
  }

  const extension = extname(file.name);
  const baseName = sanitizeFilename(file.name.replace(new RegExp(`${extension}$`), '')) || fallbackName;
  const objectName = `cms/${folder}/${Date.now()}-${randomUUID()}-${baseName}${extension.toLowerCase()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let lastError: unknown;

  for (const bucketName of buckets) {
    try {
      const bucket = getStorage().bucket(bucketName);
      const storedFile = bucket.file(objectName);
      const downloadToken = randomUUID();

      await storedFile.save(buffer, {
        resumable: false,
        contentType: file.type || undefined,
        metadata: {
          cacheControl: 'public,max-age=31536000,immutable',
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      return {
        url: createFirebaseDownloadUrl(bucket.name, objectName, downloadToken),
        name: file.name,
        contentType: file.type || 'application/octet-stream',
      };
    } catch (error) {
      if (isFirebaseAuthError(error)) {
        throw toFirebaseAuthError();
      }

      lastError = error;
    }
  }

  throw toFirebaseStorageUploadError(lastError);
}

export async function uploadStandAsset(file: File) {
  return uploadCmsAsset(file, 'stand', 'stand-datei');
}

export function isFirebaseStorageUploadError(error: unknown) {
  return error instanceof Error && error.message === FIREBASE_STORAGE_UPLOAD_ERROR;
}

export function isFirebaseStorageBucketNotFoundError(error: unknown) {
  return error instanceof Error && error.message === FIREBASE_STORAGE_BUCKET_NOT_FOUND_ERROR;
}

export function isFirebaseStoragePermissionError(error: unknown) {
  return error instanceof Error && error.message === FIREBASE_STORAGE_PERMISSION_ERROR;
}