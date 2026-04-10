'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
  uploadStandAsset,
} from '@/lib/cms/file-storage';
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
  const redirectTo = String(formData.get('redirectTo') || '/');
  const success = await loginAdmin(username, password);

  if (!success) {
    const target = redirectTo.startsWith('/') ? redirectTo : '/';
    redirect(`/admin/login?error=1&next=${encodeURIComponent(target)}`);
  }

  redirect(redirectTo.startsWith('/') ? redirectTo : '/');
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
  const removeStandAsset = String(formData.get('standAssetRemove') || '') === 'on';
  const standAssetFile = formData.get('standAssetFile');

  function redirectForUploadError(baseCode: string, error: unknown): never {
    if (isFirebaseStorageBucketNotFoundError(error)) {
      redirect(`/admin?saveError=${baseCode}-bucket`);
    }

    if (isFirebaseStoragePermissionError(error)) {
      redirect(`/admin?saveError=${baseCode}-permission`);
    }

    if (isFirebaseStorageUploadError(error)) {
      redirect(`/admin?saveError=${baseCode}`);
    }

    if (isFirebaseAuthError(error)) {
      redirect('/admin?saveError=firebase-auth');
    }

    throw error;
  }

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
      redirectForUploadError('stand-upload', error);
    }
  }

  for (const assetUpload of [
    {
      file: logoAssetFile,
      folder: 'logo',
      fallbackName: 'logo',
      errorCode: 'logo-upload',
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
  ]) {
    if (!(assetUpload.file instanceof File) || assetUpload.file.size <= 0) {
      continue;
    }

    try {
      const uploadedAsset = await uploadCmsAsset(assetUpload.file, assetUpload.folder, assetUpload.fallbackName);
      assetUpload.assign(uploadedAsset);
    } catch (error) {
      redirectForUploadError(assetUpload.errorCode, error);
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