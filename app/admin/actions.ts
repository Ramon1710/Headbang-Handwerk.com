'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
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
  const success = await loginAdmin(username, password);

  if (!success) {
    redirect('/admin/login?error=1');
  }

  redirect('/admin');
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
  const next = mergeCmsContentFromForm(formData, current);

  try {
    await saveCmsContent(next);
  } catch (error) {
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

  redirect('/admin?saved=1');
}