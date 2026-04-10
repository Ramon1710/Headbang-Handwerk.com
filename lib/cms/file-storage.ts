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

function sanitizeFilename(filename: string) {
  return filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function uploadStandAsset(file: File) {
  if (!hasFirebaseConfig()) {
    throw new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
  }

  getFirebaseDb();

  const buckets = getFirebaseStorageBucketCandidates();

  if (!buckets.length) {
    throw new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
  }

  const extension = extname(file.name);
  const baseName = sanitizeFilename(file.name.replace(new RegExp(`${extension}$`), '')) || 'stand-datei';
  const objectName = `cms/stand/${Date.now()}-${randomUUID()}-${baseName}${extension.toLowerCase()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let lastError: unknown;

  for (const bucketName of buckets) {
    try {
      const bucket = getStorage().bucket(bucketName);
      const storedFile = bucket.file(objectName);

      await storedFile.save(buffer, {
        resumable: false,
        contentType: file.type || undefined,
        metadata: {
          cacheControl: 'public,max-age=31536000,immutable',
        },
      });

      const [signedUrl] = await storedFile.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });

      return {
        url: signedUrl,
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

  throw lastError instanceof Error ? new Error(FIREBASE_STORAGE_UPLOAD_ERROR) : new Error(FIREBASE_STORAGE_UPLOAD_ERROR);
}

export function isFirebaseStorageUploadError(error: unknown) {
  return error instanceof Error && error.message === FIREBASE_STORAGE_UPLOAD_ERROR;
}