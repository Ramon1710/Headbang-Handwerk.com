import 'server-only';

import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseDb, getFirebaseStorageBucketCandidates, hasFirebaseConfig } from '@/lib/cms/firebase';
import { validateZollhausProductImageUpload } from '@/lib/zollhaus/product-image';
import type { ZollhausProductImage } from '@/lib/zollhaus/types';

function createFirebaseDownloadUrl(bucketName: string, objectName: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
}

function ensureSafePathSegment(value: string, label: string) {
  const normalized = value.trim();

  if (!/^[A-Za-z0-9_-]{8,120}$/.test(normalized)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  return normalized;
}

function extractBucketNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const bucket = parsed.pathname.match(/\/b\/([^/]+)\/o\//)?.[1];

    return bucket ? decodeURIComponent(bucket) : null;
  } catch {
    return null;
  }
}

async function resolveStorageBuckets() {
  if (!hasFirebaseConfig()) {
    throw new Error('Die Produktdatenbank ist noch nicht verbunden.');
  }

  getFirebaseDb();

  const buckets = getFirebaseStorageBucketCandidates();

  if (!buckets.length) {
    throw new Error('Die Produktdatenbank ist noch nicht verbunden.');
  }

  return buckets;
}

export async function uploadZollhausProductImage(file: File, productId: string, fallbackAlt: string): Promise<ZollhausProductImage> {
  const safeProductId = ensureSafePathSegment(productId, 'Produkt-ID');
  const imageId = randomUUID();
  const objectName = `zollhaus/products/${safeProductId}/${imageId}`;
  const validated = await validateZollhausProductImageUpload(file);
  const buckets = await resolveStorageBuckets();
  let lastError: unknown;

  for (const bucketName of buckets) {
    try {
      const bucket = getStorage().bucket(bucketName);
      const storedFile = bucket.file(objectName);
      const downloadToken = randomUUID();

      await storedFile.save(Buffer.from(validated.bytes), {
        resumable: false,
        contentType: validated.contentType,
        metadata: {
          contentType: validated.contentType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      return {
        id: imageId,
        storagePath: objectName,
        url: createFirebaseDownloadUrl(bucketName, objectName, downloadToken),
        alt: fallbackAlt,
        sortOrder: 0,
        contentType: validated.contentType,
        sizeBytes: validated.sizeBytes,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Das Produktbild konnte nicht gespeichert werden.');
}

export async function deleteZollhausProductImages(images: Array<Pick<ZollhausProductImage, 'storagePath' | 'url'>>) {
  if (!images.length || !hasFirebaseConfig()) {
    return;
  }

  getFirebaseDb();

  for (const image of images) {
    const bucketCandidates = Array.from(
      new Set([extractBucketNameFromUrl(image.url), ...getFirebaseStorageBucketCandidates()].filter(Boolean) as string[]),
    );

    for (const bucketName of bucketCandidates) {
      try {
        await getStorage().bucket(bucketName).file(image.storagePath).delete({ ignoreNotFound: true });
        break;
      } catch {
        continue;
      }
    }
  }
}
