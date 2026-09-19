import { getStorage } from 'firebase-admin/storage';
import { getFirebaseDb, getFirebaseStorageBucketCandidates, hasFirebaseConfig } from '@/lib/cms/firebase';
import { sanitizeEventSponsoringLogoFileName } from '@/lib/event-sponsoring/logo-upload';
import type { EventSponsoringLogoUpload } from '@/lib/event-sponsoring/types';
import type { ValidatedEventSponsoringLogoUpload } from '@/lib/event-sponsoring/logo-upload';

function ensureSafePathSegment(value: string, label: string) {
  const normalized = value.trim();

  if (!/^[A-Za-z0-9_-]{3,120}$/.test(normalized)) {
    throw new Error(`${label} ist ungueltig.`);
  }

  return normalized;
}

async function resolveStorageBuckets() {
  if (!hasFirebaseConfig()) {
    throw new Error('Die Sponsoring-Datenbank ist noch nicht verbunden.');
  }

  getFirebaseDb();

  const buckets = getFirebaseStorageBucketCandidates();

  if (!buckets.length) {
    throw new Error('Die Sponsoring-Datenbank ist noch nicht verbunden.');
  }

  return buckets;
}

function getBucketCandidatesForUpload(upload: Pick<EventSponsoringLogoUpload, 'storageBucket'>) {
  return Array.from(new Set([upload.storageBucket, ...getFirebaseStorageBucketCandidates()].filter(Boolean) as string[]));
}

export async function uploadEventSponsoringLogoFile(params: {
  validatedFile: ValidatedEventSponsoringLogoUpload;
  originalFileName: string;
  eventId: string;
  requestId: string;
  logoUploadId: string;
  nowIso: string;
}) {
  const safeEventId = ensureSafePathSegment(params.eventId, 'Veranstaltungs-ID');
  const safeRequestId = ensureSafePathSegment(params.requestId, 'Anfrage-ID');
  const safeLogoUploadId = ensureSafePathSegment(params.logoUploadId, 'Logo-Upload-ID');
  const objectName = `event-sponsoring/${safeEventId}/requests/${safeRequestId}/${safeLogoUploadId}.${params.validatedFile.extension}`;
  const buckets = await resolveStorageBuckets();
  let lastError: unknown;

  for (const bucketName of buckets) {
    try {
      const bucket = getStorage().bucket(bucketName);
      const storedFile = bucket.file(objectName);

      await storedFile.save(Buffer.from(params.validatedFile.bytes), {
        resumable: false,
        contentType: params.validatedFile.contentType,
        metadata: {
          contentType: params.validatedFile.contentType,
        },
      });

      return {
        logoUpload: {
          id: safeLogoUploadId,
          requestId: safeRequestId,
          eventId: safeEventId,
          storageBucket: bucketName,
          storagePath: objectName,
          originalFileName: sanitizeEventSponsoringLogoFileName(params.originalFileName),
          contentType: params.validatedFile.contentType,
          sizeBytes: params.validatedFile.sizeBytes,
          status: 'uploaded',
          uploadedAt: params.nowIso,
        } satisfies EventSponsoringLogoUpload,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Die Logo-Datei konnte nicht gespeichert werden.');
}

export async function readEventSponsoringLogoFile(upload: Pick<EventSponsoringLogoUpload, 'storageBucket' | 'storagePath' | 'originalFileName' | 'contentType'>) {
  const buckets = getBucketCandidatesForUpload(upload);
  let lastError: unknown;

  for (const bucketName of buckets) {
    try {
      const [content] = await getStorage().bucket(bucketName).file(upload.storagePath).download();
      return {
        filename: upload.originalFileName,
        contentType: upload.contentType,
        content,
        storageBucket: bucketName,
        storagePath: upload.storagePath,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Die Logo-Datei konnte nicht gelesen werden.');
}

export async function deleteEventSponsoringLogoFile(upload: Pick<EventSponsoringLogoUpload, 'storageBucket' | 'storagePath'>) {
  const buckets = getBucketCandidatesForUpload(upload);

  for (const bucketName of buckets) {
    try {
      await getStorage().bucket(bucketName).file(upload.storagePath).delete({ ignoreNotFound: true });
      return;
    } catch {
      continue;
    }
  }

  throw new Error('Die Logo-Datei konnte nicht geloescht werden.');
}