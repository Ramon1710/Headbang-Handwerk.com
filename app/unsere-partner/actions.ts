'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';
import { getCmsContent, isFirebaseAuthSaveError, isInvalidFirebaseSaveError, isReadonlyFallbackError, saveCmsContent } from '@/lib/cms/storage';
import type { CmsContent, PartnerEntry } from '@/lib/cms/schema';
import { normalizeExternalUrl } from '@/lib/site';

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

function ensurePartnerId(partners: PartnerEntry[], requestedId: string, name: string) {
  const base = slugify(requestedId || name || `partner-${Date.now()}`) || `partner-${Date.now()}`;

  if (!partners.some((partner) => partner.id === base)) {
    return base;
  }

  let counter = 2;
  let nextId = `${base}-${counter}`;

  while (partners.some((partner) => partner.id === nextId)) {
    counter += 1;
    nextId = `${base}-${counter}`;
  }

  return nextId;
}

function parsePartnerFromFormData(formData: FormData, existing?: PartnerEntry): PartnerEntry {
  return {
    id: existing?.id || '',
    name: sanitizeText(formData.get('name')),
    website: normalizeExternalUrl(sanitizeText(formData.get('website'))),
    description: sanitizeText(formData.get('description')),
    logo: existing?.logo || {
      assetUrl: '',
      assetName: '',
      assetContentType: '',
    },
  };
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin-login?next=/unsere-partner');
  }
}

function redirectForPartnerUploadError(error: unknown): never {
  if (isInvalidFirebaseConfigError(error)) {
    redirect('/unsere-partner?adminError=invalid-firebase');
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    redirect('/unsere-partner?adminError=logo-upload-bucket');
  }

  if (isFirebaseStoragePermissionError(error)) {
    redirect('/unsere-partner?adminError=logo-upload-permission');
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    redirect('/unsere-partner?adminError=logo-upload');
  }

  throw error;
}

async function persistPartners(updater: (current: CmsContent) => CmsContent | Promise<CmsContent>) {
  const current = await getCmsContent();
  const next = await updater(current);

  try {
    await saveCmsContent(next);
  } catch (error) {
    if (isFirebaseAuthSaveError(error)) {
      redirect('/unsere-partner?adminError=firebase-auth');
    }

    if (isInvalidFirebaseSaveError(error)) {
      redirect('/unsere-partner?adminError=invalid-firebase');
    }

    if (isReadonlyFallbackError(error)) {
      redirect('/unsere-partner?adminError=missing-config');
    }

    throw error;
  }

  revalidatePath('/', 'layout');
  revalidatePath('/unsere-partner');
}

export async function addPartnerAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  const partner = parsePartnerFromFormData(formData);

  if (!partner.name || !partner.description) {
    redirect('/unsere-partner?adminError=missing-partner-fields');
  }

  const logoFile = formData.get('logoFile');

  if (logoFile instanceof File && logoFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/unsere-partner?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(logoFile, 'partners', 'partner-logo');
      partner.logo = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForPartnerUploadError(error);
    }
  }

  partner.id = ensurePartnerId(current.site.partners, sanitizeText(formData.get('id')), partner.name);

  await persistPartners(async () => ({
    ...current,
    site: {
      ...current.site,
      partners: [...current.site.partners, partner],
    },
  }));

  redirect('/unsere-partner?adminSaved=partner-added');
}

export async function updatePartnerAction(formData: FormData) {
  await assertAdmin();

  const partnerId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();
  const existingPartner = current.site.partners.find((partner) => partner.id === partnerId);

  if (!existingPartner) {
    redirect('/unsere-partner?adminError=missing-partner');
  }

  const nextPartner = parsePartnerFromFormData(formData, existingPartner);
  const removeLogo = String(formData.get('removeLogo') || '') === 'on';
  const logoFile = formData.get('logoFile');

  if (removeLogo) {
    nextPartner.logo = {
      assetUrl: '',
      assetName: '',
      assetContentType: '',
    };
  }

  if (logoFile instanceof File && logoFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/unsere-partner?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(logoFile, 'partners', 'partner-logo');
      nextPartner.logo = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForPartnerUploadError(error);
    }
  }

  await persistPartners(async () => ({
    ...current,
    site: {
      ...current.site,
      partners: current.site.partners.map((partner) => (partner.id === partnerId ? { ...existingPartner, ...nextPartner } : partner)),
    },
  }));

  redirect('/unsere-partner?adminSaved=partner-updated');
}

export async function removePartnerAction(formData: FormData) {
  await assertAdmin();

  const partnerId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistPartners(async () => ({
    ...current,
    site: {
      ...current.site,
      partners: current.site.partners.filter((partner) => partner.id !== partnerId),
    },
  }));

  redirect('/unsere-partner?adminSaved=partner-removed');
}

export async function movePartnerAction(formData: FormData) {
  await assertAdmin();

  const partnerId = sanitizeText(formData.get('id'));
  const direction = sanitizeText(formData.get('direction'));
  const current = await getCmsContent();
  const currentIndex = current.site.partners.findIndex((partner) => partner.id === partnerId);

  if (currentIndex < 0) {
    redirect('/unsere-partner?adminError=missing-partner');
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : direction === 'down' ? currentIndex + 1 : currentIndex;

  if (nextIndex < 0 || nextIndex >= current.site.partners.length || nextIndex === currentIndex) {
    redirect('/unsere-partner?adminSaved=partner-order');
  }

  const nextPartners = [...current.site.partners];
  const [partner] = nextPartners.splice(currentIndex, 1);
  nextPartners.splice(nextIndex, 0, partner);

  await persistPartners(async () => ({
    ...current,
    site: {
      ...current.site,
      partners: nextPartners,
    },
  }));

  redirect('/unsere-partner?adminSaved=partner-order');
}