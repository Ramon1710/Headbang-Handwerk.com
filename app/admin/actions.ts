'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFirebaseStorageUploadError, uploadStandAsset } from '@/lib/cms/file-storage';
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
  const removeStandAsset = String(formData.get('standAssetRemove') || '') === 'on';
  const standAssetFile = formData.get('standAssetFile');

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
  revalidatePath('/veranstaltungen');
  revalidatePath('/ueber-uns');
  revalidatePath('/drei-d-stand');

  redirect('/admin?saved=1');
}