import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent, isFirebaseAuthSaveError, isInvalidFirebaseSaveError, isReadonlyFallbackError, saveCmsContent } from '@/lib/cms/storage';
import type { GalleryFolder, MediaAsset } from '@/lib/cms/schema';

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
    return redirectToLogin(request);
  }

  const formData = await request.formData();
  const folderId = sanitizeText(formData.get('folderId'));
  const imageId = sanitizeText(formData.get('imageId'));

  try {
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

  return NextResponse.redirect(buildRedirectUrl(request, formData, 'image-removed'), { status: 303 });
}