import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';
import { getCmsContent, isFirebaseAuthSaveError, isInvalidFirebaseSaveError, isReadonlyFallbackError, saveCmsContent } from '@/lib/cms/storage';
import type { GalleryFolder, GalleryImage, MediaAsset } from '@/lib/cms/schema';

function sanitizeText(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function emptyAsset(): MediaAsset {
  return { assetUrl: '', assetName: '', assetContentType: '' };
}

function buildRedirectUrl(request: Request, formData: FormData, adminSaved?: string, adminError?: string) {
  const folder = sanitizeText(formData.get('returnToFolder'));
  const url = new URL('/gallerie', request.url);

  if (folder) {
    url.searchParams.set('folder', folder);
  }

  if (adminSaved) {
    url.searchParams.set('adminSaved', adminSaved);
  }

  if (adminError) {
    url.searchParams.set('adminError', adminError);
  }

  return url;
}

function redirectToLogin(request: Request) {
  const url = new URL('/admin-login', request.url);
  url.searchParams.set('next', '/gallerie');
  return NextResponse.redirect(url, { status: 303 });
}

function redirectForGalleryUploadError(request: Request, formData: FormData, error: unknown) {
  if (isInvalidFirebaseConfigError(error)) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'invalid-firebase'), { status: 303 });
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'image-upload-bucket'), { status: 303 });
  }

  if (isFirebaseStoragePermissionError(error)) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'image-upload-permission'), { status: 303 });
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'image-upload'), { status: 303 });
  }

  throw error;
}

async function persistGallery(updater: (folders: GalleryFolder[]) => GalleryFolder[] | Promise<GalleryFolder[]>) {
  const current = await getCmsContent();
  const nextFolders = await updater(current.site.gallery.folders);

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      gallery: {
        ...current.site.gallery,
        folders: nextFolders,
      },
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/gallerie');
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return redirectToLogin(request);
  }

  const formData = await request.formData();
  const folderId = sanitizeText(formData.get('folderId'));
  const current = await getCmsContent();
  const existingFolder = current.site.gallery.folders.find((folder) => folder.id === folderId);

  if (!existingFolder) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'missing-folder'), { status: 303 });
  }

  if (!hasFirebaseConfig()) {
    return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'missing-config'), { status: 303 });
  }

  const nextImages: GalleryImage[] = [...existingFolder.images];
  const files = formData.getAll('imageFiles');

  for (const entry of files) {
    if (!(entry instanceof File) || entry.size <= 0) {
      continue;
    }

    try {
      const uploadedAsset = await uploadCmsAsset(entry, `gallery/${folderId}/images`, 'galeriebild');
      nextImages.push({
        id: randomUUID(),
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      });
    } catch (error) {
      return redirectForGalleryUploadError(request, formData, error);
    }
  }

  try {
    await persistGallery(async (folders) =>
      folders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              images: nextImages,
              coverImage: folder.coverImage.assetUrl ? folder.coverImage : nextImages[0] || emptyAsset(),
            }
          : folder
      )
    );
  } catch (error) {
    if (isFirebaseAuthSaveError(error)) {
      return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'firebase-auth'), { status: 303 });
    }

    if (isInvalidFirebaseSaveError(error)) {
      return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'invalid-firebase'), { status: 303 });
    }

    if (isReadonlyFallbackError(error)) {
      return NextResponse.redirect(buildRedirectUrl(request, formData, undefined, 'missing-config'), { status: 303 });
    }

    throw error;
  }

  return NextResponse.redirect(buildRedirectUrl(request, formData, 'images-added'), { status: 303 });
}