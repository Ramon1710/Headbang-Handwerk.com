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
import type { CmsContent } from '@/lib/cms/schema';
import type { MerchandiseProduct } from '@/lib/types';

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

function splitList(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function ensureProductId(products: MerchandiseProduct[], requestedId: string, name: string) {
  const base = slugify(requestedId || name || `product-${Date.now()}`) || `product-${Date.now()}`;

  if (!products.some((product) => product.id === base)) {
    return base;
  }

  let counter = 2;
  let nextId = `${base}-${counter}`;
  while (products.some((product) => product.id === nextId)) {
    counter += 1;
    nextId = `${base}-${counter}`;
  }

  return nextId;
}

function redirectForMerchandiseUploadError(error: unknown): never {
  if (isInvalidFirebaseConfigError(error)) {
    redirect('/merchandise?adminError=invalid-firebase');
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    redirect('/merchandise?adminError=image-upload-bucket');
  }

  if (isFirebaseStoragePermissionError(error)) {
    redirect('/merchandise?adminError=image-upload-permission');
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    redirect('/merchandise?adminError=image-upload');
  }

  throw error;
}

function parseProductFromFormData(formData: FormData, existingId?: string): MerchandiseProduct {
  const name = sanitizeText(formData.get('name'));
  const description = sanitizeText(formData.get('description'));
  const price = Number.parseFloat(sanitizeText(formData.get('price')).replace(',', '.'));

  return {
    id: existingId || '',
    name,
    description,
    price: Number.isFinite(price) ? price : 0,
    badge: sanitizeText(formData.get('badge')) || undefined,
    imageUrl: sanitizeText(formData.get('imageUrl')) || undefined,
    sizes: splitList(formData.get('sizes')),
    colors: splitList(formData.get('colors')),
  };
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/merchandise');
  }
}

async function persistMerchandise(updater: (current: CmsContent) => CmsContent | Promise<CmsContent>) {
  const current = await getCmsContent();
  const next = await updater(current);

  try {
    await saveCmsContent(next);
  } catch (error) {
    if (isFirebaseAuthSaveError(error)) {
      redirect('/merchandise?adminError=firebase-auth');
    }

    if (isInvalidFirebaseSaveError(error)) {
      redirect('/merchandise?adminError=invalid-firebase');
    }

    if (isReadonlyFallbackError(error)) {
      redirect('/merchandise?adminError=missing-config');
    }

    throw error;
  }

  revalidatePath('/', 'layout');
  revalidatePath('/merchandise');
}

export async function updateMerchandiseIntroAction(formData: FormData) {
  await assertAdmin();

  await persistMerchandise(async (current) => ({
    ...current,
    site: {
      ...current.site,
      merchandise: {
        ...current.site.merchandise,
        eyebrow: sanitizeText(formData.get('eyebrow')) || current.site.merchandise.eyebrow,
        title: sanitizeText(formData.get('title')) || current.site.merchandise.title,
        lead: sanitizeText(formData.get('lead')) || current.site.merchandise.lead,
      },
    },
  }));

  redirect('/merchandise?adminSaved=intro');
}

export async function addMerchandiseProductAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  const product = parseProductFromFormData(formData);

  if (!product.name || !product.description || product.price <= 0) {
    redirect('/merchandise?adminError=invalid-product');
  }

  const imageFile = formData.get('imageFile');

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/merchandise?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(imageFile, 'merchandise', 'merchandise-bild');
      product.imageUrl = uploadedAsset.url;
    } catch (error) {
      redirectForMerchandiseUploadError(error);
    }
  }

  product.id = ensureProductId(current.site.merchandise.products, sanitizeText(formData.get('id')), product.name);

  await persistMerchandise(async () => ({
    ...current,
    site: {
      ...current.site,
      merchandise: {
        ...current.site.merchandise,
        products: [...current.site.merchandise.products, product],
      },
    },
  }));

  redirect('/merchandise?adminSaved=product-added');
}

export async function updateMerchandiseProductAction(formData: FormData) {
  await assertAdmin();

  const productId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();
  const existingProduct = current.site.merchandise.products.find((product) => product.id === productId);

  if (!existingProduct) {
    redirect('/merchandise?adminError=missing-product');
  }

  const nextProduct = parseProductFromFormData(formData, productId);

  const imageFile = formData.get('imageFile');

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!hasFirebaseConfig()) {
      redirect('/merchandise?adminError=missing-config');
    }

    try {
      const uploadedAsset = await uploadCmsAsset(imageFile, 'merchandise', 'merchandise-bild');
      nextProduct.imageUrl = uploadedAsset.url;
    } catch (error) {
      redirectForMerchandiseUploadError(error);
    }
  }

  await persistMerchandise(async () => ({
    ...current,
    site: {
      ...current.site,
      merchandise: {
        ...current.site.merchandise,
        products: current.site.merchandise.products.map((product) => (product.id === productId ? { ...existingProduct, ...nextProduct } : product)),
      },
    },
  }));

  redirect('/merchandise?adminSaved=product-updated');
}

export async function removeMerchandiseProductAction(formData: FormData) {
  await assertAdmin();

  const productId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistMerchandise(async () => ({
    ...current,
    site: {
      ...current.site,
      merchandise: {
        ...current.site.merchandise,
        products: current.site.merchandise.products.filter((product) => product.id !== productId),
      },
    },
  }));

  redirect('/merchandise?adminSaved=product-removed');
}