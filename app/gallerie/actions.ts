'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function emptyAsset(): MediaAsset {
  return { assetUrl: '', assetName: '', assetContentType: '' };
}

function ensureFolderId(folders: GalleryFolder[], requestedId: string, title: string) {
  const base = slugify(requestedId || title || `gallery-${Date.now()}`) || `gallery-${Date.now()}`;

  if (!folders.some((folder) => folder.id === base)) {
    return base;
  }

  let counter = 2;
  let nextId = `${base}-${counter}`;
  while (folders.some((folder) => folder.id === nextId)) {
    counter += 1;
    nextId = `${base}-${counter}`;
  }

  return nextId;
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin-login?next=/gallerie');
  }
}

function redirectForGalleryUploadError(error: unknown): never {
  if (isInvalidFirebaseConfigError(error)) {
    redirect('/gallerie?adminError=invalid-firebase');
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    redirect('/gallerie?adminError=image-upload-bucket');
  }

  if (isFirebaseStoragePermissionError(error)) {
    redirect('/gallerie?adminError=image-upload-permission');
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    redirect('/gallerie?adminError=image-upload');
  }

  throw error;
}

async function persistGallery(updater: (folders: GalleryFolder[]) => GalleryFolder[] | Promise<GalleryFolder[]>) {
  const current = await getCmsContent();
  const nextFolders = await updater(current.site.gallery.folders);

  try {
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
  } catch (error) {
    if (isFirebaseAuthSaveError(error)) {
      redirect('/gallerie?adminError=firebase-auth');
    }

    if (isInvalidFirebaseSaveError(error)) {
      redirect('/gallerie?adminError=invalid-firebase');
    }

    if (isReadonlyFallbackError(error)) {
      redirect('/gallerie?adminError=missing-config');
    }

    throw error;
  }

  revalidatePath('/', 'layout');
  revalidatePath('/gallerie');
}

export async function addGalleryFolderAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  const title = sanitizeText(formData.get('title'));

  if (!title) {
    redirect('/gallerie?adminError=missing-title');
  }

  const folderId = ensureFolderId(current.site.gallery.folders, sanitizeText(formData.get('id')), title);
  let coverImage = emptyAsset();
  const coverImageFile = formData.get('coverImageFile');

  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/gallerie?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(coverImageFile, `gallery/${folderId}/cover`, 'ordnerbild');
      coverImage = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForGalleryUploadError(error);
    }
  }

  await persistGallery(async (folders) => [
    ...folders,
    {
      id: folderId,
      title,
      coverImage,
      images: [],
    },
  ]);

  redirect('/gallerie?adminSaved=folder-added');
}

export async function updateGalleryFolderAction(formData: FormData) {
  await assertAdmin();

  const folderId = sanitizeText(formData.get('id'));
  const title = sanitizeText(formData.get('title'));
  const current = await getCmsContent();
  const existingFolder = current.site.gallery.folders.find((folder) => folder.id === folderId);

  if (!existingFolder) {
    redirect('/gallerie?adminError=missing-folder');
  }

  let coverImage = existingFolder.coverImage;

  if (String(formData.get('removeCoverImage') || '') === 'on') {
    coverImage = emptyAsset();
  }

  const coverImageFile = formData.get('coverImageFile');
  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/gallerie?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(coverImageFile, `gallery/${folderId}/cover`, 'ordnerbild');
      coverImage = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForGalleryUploadError(error);
    }
  }

  await persistGallery(async (folders) =>
    folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            title: title || folder.title,
            coverImage,
          }
        : folder
    )
  );

  redirect('/gallerie?adminSaved=folder-updated');
}

export async function removeGalleryFolderAction(formData: FormData) {
  await assertAdmin();

  const folderId = sanitizeText(formData.get('id'));

  await persistGallery(async (folders) => folders.filter((folder) => folder.id !== folderId));

  redirect('/gallerie?adminSaved=folder-removed');
}

export async function addGalleryImagesAction(formData: FormData) {
  await assertAdmin();

  const folderId = sanitizeText(formData.get('folderId'));
  const current = await getCmsContent();
  const existingFolder = current.site.gallery.folders.find((folder) => folder.id === folderId);

  if (!existingFolder) {
    redirect('/gallerie?adminError=missing-folder');
  }

  if (!hasFirebaseConfig()) {
    redirect('/gallerie?adminError=missing-config');
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
      redirectForGalleryUploadError(error);
    }
  }

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

  redirect('/gallerie?adminSaved=images-added');
}

export async function removeGalleryImageAction(formData: FormData) {
  await assertAdmin();

  const folderId = sanitizeText(formData.get('folderId'));
  const imageId = sanitizeText(formData.get('imageId'));

  await persistGallery(async (folders) =>
    folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }

      const images = folder.images.filter((image) => image.id !== imageId);
      const shouldResetCover = folder.coverImage.assetUrl && !images.some((image) => image.assetUrl === folder.coverImage.assetUrl);

      return {
        ...folder,
        images,
        coverImage: shouldResetCover ? images[0] || emptyAsset() : folder.coverImage,
      };
    })
  );

  redirect('/gallerie?adminSaved=image-removed');
}