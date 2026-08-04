import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import type { CmsAssetUploadTarget } from '@/lib/cms/file-storage';
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
    return NextResponse.json({ redirectTo: '/admin-login?next=/gallerie' }, { status: 401 });
  }

  const payload = (await request.json()) as {
    folderId?: string;
    returnToFolder?: string;
    uploadedImages?: CmsAssetUploadTarget[];
  };
  const folderId = sanitizeText(payload.folderId || null);
  const current = await getCmsContent();
  const existingFolder = current.site.gallery.folders.find((folder) => folder.id === folderId);
  const uploadedImages = Array.isArray(payload.uploadedImages) ? payload.uploadedImages : [];

  if (!existingFolder) {
    const formData = new FormData();
    formData.set('returnToFolder', sanitizeText(payload.returnToFolder || null));
    return NextResponse.json({ redirectTo: buildRedirectUrl(request, formData, undefined, 'missing-folder').toString() }, { status: 404 });
  }

  const nextImages: GalleryImage[] = [...existingFolder.images];

  for (const uploadedImage of uploadedImages) {
    if (!uploadedImage?.assetUrl) {
      continue;
    }

    nextImages.push({
      id: crypto.randomUUID(),
      assetUrl: String(uploadedImage.assetUrl || '').trim(),
      assetName: String(uploadedImage.assetName || '').trim(),
      assetContentType: String(uploadedImage.assetContentType || '').trim(),
    });
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
    const formData = new FormData();
    formData.set('returnToFolder', sanitizeText(payload.returnToFolder || null));

    if (isFirebaseAuthSaveError(error)) {
      return NextResponse.json({ redirectTo: buildRedirectUrl(request, formData, undefined, 'firebase-auth').toString() }, { status: 500 });
    }

    if (isInvalidFirebaseSaveError(error)) {
      return NextResponse.json({ redirectTo: buildRedirectUrl(request, formData, undefined, 'invalid-firebase').toString() }, { status: 500 });
    }

    if (isReadonlyFallbackError(error)) {
      return NextResponse.json({ redirectTo: buildRedirectUrl(request, formData, undefined, 'missing-config').toString() }, { status: 500 });
    }

    throw error;
  }

  const formData = new FormData();
  formData.set('returnToFolder', sanitizeText(payload.returnToFolder || null));
  return NextResponse.json({ redirectTo: buildRedirectUrl(request, formData, 'images-added').toString() });
}