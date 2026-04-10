'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFirebaseStorageUploadError, uploadCmsAsset, uploadStandAsset } from '@/lib/cms/file-storage';
import { isFirebaseAuthError } from '@/lib/cms/firebase';
import {
  isFirebaseAuthSaveError,
  getCmsContent,
  isInvalidFirebaseSaveError,
  isReadonlyFallbackError,
  saveCmsContent,
} from '@/lib/cms/storage';
import { isAdminAuthenticated, loginAdmin, logoutAdmin } from '@/lib/cms/auth';
import { mergeCmsContentFromForm } from '@/lib/cms/form-data';

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '');
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/admin');
  const success = await loginAdmin(username, password);

  if (!success) {
    const target = redirectTo.startsWith('/') ? redirectTo : '/admin';
    redirect(`/admin/login?error=1&next=${encodeURIComponent(target)}`);
  }

  redirect(redirectTo.startsWith('/') ? redirectTo : '/admin');
}

export async function logoutAction() {
  await logoutAdmin();
  redirect('/admin/login');
}

export async function updateCmsAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const current = await getCmsContent();
  let next = mergeCmsContentFromForm(formData, current);
  const removeLogoAsset = String(formData.get('logoAssetRemove') || '') === 'on';
  const logoAssetFile = formData.get('logoAssetFile');
  const removeHeroImageAsset = String(formData.get('heroImageAssetRemove') || '') === 'on';
  const heroImageAssetFile = formData.get('heroImageAssetFile');
  const removeBackgroundImageAsset = String(formData.get('backgroundImageAssetRemove') || '') === 'on';
  const backgroundImageAssetFile = formData.get('backgroundImageAssetFile');
  const removeStandAsset = String(formData.get('standAssetRemove') || '') === 'on';
  const standAssetFile = formData.get('standAssetFile');

  if (removeLogoAsset) {
    next = {
      ...next,
      site: {
        ...next.site,
        logo: {
          assetUrl: '',
          assetName: '',
          assetContentType: '',
        },
      },
    };
  }

  if (removeHeroImageAsset) {
    next = {
      ...next,
      site: {
        ...next.site,
        home: {
          ...next.site.home,
          heroImage: {
            assetUrl: '',
            assetName: '',
            assetContentType: '',
          },
        },
      },
    };
  }

  if (removeBackgroundImageAsset) {
    next = {
      ...next,
      site: {
        ...next.site,
        home: {
          ...next.site.home,
          backgroundImage: {
            assetUrl: '',
            assetName: '',
            assetContentType: '',
          },
        },
      },
    };
  }

  if (removeStandAsset) {
    next = {
      ...next,
      site: {
        ...next.site,
        stand: {
          ...next.site.stand,
          assetUrl: '',
          assetName: '',
          assetContentType: '',
        },
      },
    };
  }

  if (standAssetFile instanceof File && standAssetFile.size > 0) {
    try {
      const uploadedAsset = await uploadStandAsset(standAssetFile);

      next = {
        ...next,
        site: {
          ...next.site,
          stand: {
            ...next.site.stand,
            assetUrl: uploadedAsset.url,
            assetName: uploadedAsset.name,
            assetContentType: uploadedAsset.contentType,
          },
        },
      };
    } catch (error) {
      if (isFirebaseStorageUploadError(error)) {
        redirect('/admin?saveError=stand-upload');
      }

      if (isFirebaseAuthError(error)) {
        redirect('/admin?saveError=firebase-auth');
      }

      throw error;
    }
  }

  for (const assetUpload of [
    {
      file: logoAssetFile,
      folder: 'logo',
      fallbackName: 'logo',
      assign: (uploadedAsset: Awaited<ReturnType<typeof uploadCmsAsset>>) => {
        next = {
          ...next,
          site: {
            ...next.site,
            logo: {
              assetUrl: uploadedAsset.url,
              assetName: uploadedAsset.name,
              assetContentType: uploadedAsset.contentType,
            },
          },
        };
      },
    },
    {
      file: heroImageAssetFile,
      folder: 'home-hero',
      fallbackName: 'hero-bild',
      assign: (uploadedAsset: Awaited<ReturnType<typeof uploadCmsAsset>>) => {
        next = {
          ...next,
          site: {
            ...next.site,
            home: {
              ...next.site.home,
              heroImage: {
                assetUrl: uploadedAsset.url,
                assetName: uploadedAsset.name,
                assetContentType: uploadedAsset.contentType,
              },
            },
          },
        };
      },
    },
    {
      file: backgroundImageAssetFile,
      folder: 'home-background',
      fallbackName: 'hintergrund-bild',
      assign: (uploadedAsset: Awaited<ReturnType<typeof uploadCmsAsset>>) => {
        next = {
          ...next,
          site: {
            ...next.site,
            home: {
              ...next.site.home,
              backgroundImage: {
                assetUrl: uploadedAsset.url,
                assetName: uploadedAsset.name,
                assetContentType: uploadedAsset.contentType,
              },
            },
          },
        };
      },
    },
  ]) {
    if (!(assetUpload.file instanceof File) || assetUpload.file.size <= 0) {
      continue;
    }

    try {
      const uploadedAsset = await uploadCmsAsset(assetUpload.file, assetUpload.folder, assetUpload.fallbackName);
      assetUpload.assign(uploadedAsset);
    } catch (error) {
      if (isFirebaseStorageUploadError(error)) {
        redirect('/admin?saveError=stand-upload');
      }

      if (isFirebaseAuthError(error)) {
        redirect('/admin?saveError=firebase-auth');
      }

      throw error;
    }
  }

  try {
    await saveCmsContent(next);
  } catch (error) {
    if (isFirebaseAuthSaveError(error)) {
      redirect('/admin?saveError=firebase-auth');
    }

    if (isInvalidFirebaseSaveError(error)) {
      redirect('/admin?saveError=invalid-firebase');
    }

    if (isReadonlyFallbackError(error)) {
      redirect('/admin?saveError=missing-config');
    }

    throw error;
  }

  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/kontakt');
  revalidatePath('/veranstaltungen');
  revalidatePath('/ueber-uns');
  revalidatePath('/drei-d-stand');

  redirect('/admin?saved=1');
}