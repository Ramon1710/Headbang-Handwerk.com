import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  createCmsAssetUploadTarget,
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';

function sanitizeText(value: unknown) {
  return String(value || '').trim();
}

function errorCodeFromUploadError(error: unknown) {
  if (isInvalidFirebaseConfigError(error)) {
    return 'invalid-firebase';
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    return 'image-upload-bucket';
  }

  if (isFirebaseStoragePermissionError(error)) {
    return 'image-upload-permission';
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    return 'image-upload';
  }

  throw error;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ redirectTo: '/admin-login?next=/gallerie' }, { status: 401 });
  }

  const payload = (await request.json()) as {
    folderId?: string;
    files?: Array<{ name?: string; type?: string }>;
  };

  if (!hasFirebaseConfig()) {
    return NextResponse.json({ errorCode: 'missing-config' }, { status: 400 });
  }

  const folderId = sanitizeText(payload.folderId);
  const files = Array.isArray(payload.files) ? payload.files : [];

  try {
    const uploadTargets = await Promise.all(
      files.map((file) =>
        createCmsAssetUploadTarget(
          sanitizeText(file.name) || 'upload',
          sanitizeText(file.type) || 'application/octet-stream',
          `gallery/${folderId}/images`,
          'galeriebild'
        )
      )
    );

    return NextResponse.json({ uploadTargets });
  } catch (error) {
    return NextResponse.json({ errorCode: errorCodeFromUploadError(error) }, { status: 500 });
  }
}