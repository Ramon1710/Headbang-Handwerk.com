import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';

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

  if (!hasFirebaseConfig()) {
    return NextResponse.json({ errorCode: 'missing-config' }, { status: 400 });
  }

  const formData = await request.formData();
  const imageFile = formData.get('imageFile');

  if (!(imageFile instanceof File) || imageFile.size <= 0) {
    return NextResponse.json({ errorCode: 'image-upload' }, { status: 400 });
  }

  const folderId = String(formData.get('folderId') || '').trim();

  try {
    const uploadedImage = await uploadCmsAsset(imageFile, `gallery/${folderId}/images`, 'galeriebild');

    return NextResponse.json({
      uploadedImage: {
        assetUrl: uploadedImage.url,
        assetName: uploadedImage.name,
        assetContentType: uploadedImage.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json({ errorCode: errorCodeFromUploadError(error) }, { status: 500 });
  }
}