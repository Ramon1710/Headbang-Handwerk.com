'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasFirebaseConfig } from '@/lib/cms/firebase';
import { loginZollhausAdmin, logoutAdmin, requireTrustedOrigin, requireZollhausAccess } from '@/lib/cms/auth';
import {
  getZollhausOrderStatusLabel,
  isValidZollhausOrderId,
  restoreZollhausOrderStock,
  retryFailedOrPendingZollhausCustomerOrderEmail,
  retryFailedOrPendingZollhausOrderEmail,
  updateZollhausManagedOrderStatus,
} from '@/lib/zollhaus/order-management';
import { parseEuroAmountToCents, parseNonNegativeInteger } from '@/lib/zollhaus/product-admin';
import { deleteZollhausProductImages, uploadZollhausProductImage } from '@/lib/zollhaus/product-image-storage';
import { createZollhausProduct, deleteZollhausProduct, getZollhausProduct, updateZollhausProduct } from '@/lib/zollhaus/products';
import { normalizeZollhausProduct } from '@/lib/zollhaus/validation';
import type { ZollhausProduct, ZollhausProductImage, ZollhausProductStatus } from '@/lib/zollhaus/types';

const ZOLLHAUS_PRODUCT_IMAGE_LIMIT = 5;

export async function loginAction(formData: FormData) {
  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin/login?error=1');
  }

  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  const result = await loginZollhausAdmin(username, password);

  if (!result.ok) {
    if (result.reason === 'rate-limited') {
      redirect('/zollhaus/admin/login?locked=1');
    }

    if (result.reason === 'not-configured') {
      redirect('/zollhaus/admin/login?error=1');
    }

    redirect('/zollhaus/admin/login?error=1');
  }

  redirect('/zollhaus/admin');
}

export async function logoutAction() {
  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin/login');
  }

  await logoutAdmin();
  redirect('/zollhaus/admin/login');
}

function buildAdminRedirect(options?: {
  productId?: string;
  createMode?: boolean;
  filter?: string;
  page?: string;
  saved?: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (options?.productId) {
    params.set('product', options.productId);
  }

  if (options?.createMode) {
    params.set('new', '1');
  }

  if (options?.filter) {
    params.set('filter', options.filter);
  }

  if (options?.page) {
    params.set('page', options.page);
  }

  if (options?.saved) {
    params.set('saved', options.saved);
  }

  if (options?.error) {
    params.set('error', options.error);
  }

  const query = params.toString();
  return query ? `/zollhaus/admin?${query}` : '/zollhaus/admin';
}

function buildOrderDetailRedirect(orderId: string, options?: { saved?: string; error?: string }) {
  const params = new URLSearchParams();

  if (options?.saved) {
    params.set('saved', options.saved);
  }

  if (options?.error) {
    params.set('error', options.error);
  }

  const query = params.toString();
  return query ? `/zollhaus/admin/orders/${encodeURIComponent(orderId)}?${query}` : `/zollhaus/admin/orders/${encodeURIComponent(orderId)}`;
}

function parseStatus(input: FormDataEntryValue | null): ZollhausProductStatus {
  return input === 'archived' ? 'archived' : 'active';
}

function parseText(input: FormDataEntryValue | null) {
  return String(input ?? '').trim();
}

function parseTextArea(input: FormDataEntryValue | null) {
  return String(input ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function parseOptionalSort(input: FormDataEntryValue | null, fallback: number) {
  const value = parseText(input);

  if (!value) {
    return fallback;
  }

  return parseNonNegativeInteger(value, 'Die Bildreihenfolge');
}

function parseNewImageAltLines(formData: FormData) {
  return parseTextArea(formData.get('newImageAlts'))
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function ensureFirebaseAvailable() {
  if (!hasFirebaseConfig()) {
    throw new Error('Die Produktdatenbank ist noch nicht verbunden. Bitte Firebase fuer Zollhaus konfigurieren.');
  }
}

function revalidateZollhausPages() {
  revalidatePath('/zollhaus');
  revalidatePath('/zollhaus/admin');
  revalidatePath('/zollhaus/admin/orders/[orderId]', 'page');
}

function revalidateZollhausProductPages(productId: string) {
  revalidateZollhausPages();
  revalidatePath(`/zollhaus/produkt/${productId}`);
}

async function buildProductImagesFromFormData(
  formData: FormData,
  productId: string,
  productName: string,
  currentProduct?: ZollhausProduct | null,
) {
  const nextImages: ZollhausProductImage[] = [];
  const uploadedImages: ZollhausProductImage[] = [];
  const obsoleteImages: ZollhausProductImage[] = [];
  const newImageFiles = formData
    .getAll('newImages')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const keptExistingImages = currentProduct
    ? currentProduct.images.filter((image) => formData.get(`imageRemove:${image.id}`) !== 'on')
    : [];

  if (keptExistingImages.length + newImageFiles.length > ZOLLHAUS_PRODUCT_IMAGE_LIMIT) {
    throw new Error(`Pro Produkt sind maximal ${ZOLLHAUS_PRODUCT_IMAGE_LIMIT} Bilder erlaubt.`);
  }

  if (currentProduct) {
    for (const [index, image] of currentProduct.images.entries()) {
      const remove = formData.get(`imageRemove:${image.id}`) === 'on';
      const alt = parseText(formData.get(`imageAlt:${image.id}`)) || productName;
      const sortOrder = parseOptionalSort(formData.get(`imageSort:${image.id}`), index);
      const replacement = formData.get(`imageReplace:${image.id}`);

      if (remove) {
        obsoleteImages.push(image);
        continue;
      }

      if (replacement instanceof File && replacement.size > 0) {
        const uploaded = await uploadZollhausProductImage(replacement, productId, alt);
        uploadedImages.push(uploaded);
        obsoleteImages.push(image);
        nextImages.push({
          ...uploaded,
          alt,
          sortOrder,
        });
        continue;
      }

      nextImages.push({
        ...image,
        alt,
        sortOrder,
      });
    }
  }
  const newImageAlts = parseNewImageAltLines(formData);

  for (const [index, file] of newImageFiles.entries()) {
    const alt = newImageAlts[index] || productName;
    const uploaded = await uploadZollhausProductImage(file, productId, alt);
    uploadedImages.push(uploaded);
    nextImages.push({
      ...uploaded,
      alt,
      sortOrder: nextImages.length,
    });
  }

  return {
    nextImages,
    uploadedImages,
    obsoleteImages,
  };
}

export async function saveProductAction(formData: FormData) {
  await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect(buildAdminRedirect({ error: 'Die Anfrage konnte nicht bestaetigt werden.' }));
  }

  const requestedProductId = parseText(formData.get('productId'));
  const createMode = !requestedProductId;

  try {
    ensureFirebaseAvailable();

    const currentProduct = requestedProductId ? await getZollhausProduct(requestedProductId) : null;

    if (requestedProductId && !currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    const productId = currentProduct?.id || randomUUID();
    const name = parseText(formData.get('name'));
    const description = parseTextArea(formData.get('description'));
    const priceCents = parseEuroAmountToCents(formData.get('priceEuro'));
    const stockQuantity = parseNonNegativeInteger(formData.get('stockQuantity'), 'Die verfuegbare Menge');
    const status = 'active';

    const imageMutation = await buildProductImagesFromFormData(formData, productId, name, currentProduct);

    if (status === 'active' && imageMutation.nextImages.length === 0) {
      throw new Error('Ein aktives Produkt benoetigt mindestens ein Produktbild.');
    }

    const baseProduct = normalizeZollhausProduct(
      {
        id: productId,
        name,
        description,
        priceCents,
        stockQuantity,
        images: imageMutation.nextImages,
        status,
        ...(currentProduct?.createdAt ? { createdAt: currentProduct.createdAt } : {}),
      },
      currentProduct ? { existing: currentProduct } : undefined,
    );

    try {
      if (currentProduct) {
        await updateZollhausProduct(productId, baseProduct);
      } else {
        await createZollhausProduct(baseProduct);
      }
    } catch (error) {
      await deleteZollhausProductImages(imageMutation.uploadedImages);
      throw error;
    }

    await deleteZollhausProductImages(imageMutation.obsoleteImages);
    revalidateZollhausProductPages(productId);

    redirect(
      buildAdminRedirect({
        productId,
        saved: currentProduct ? 'updated' : 'created',
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Das Produkt konnte nicht gespeichert werden.';
    redirect(buildAdminRedirect({ productId: requestedProductId || undefined, createMode, error: message }));
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect(buildAdminRedirect({ error: 'Die Anfrage konnte nicht bestaetigt werden.' }));
  }

  const productId = parseText(formData.get('productId'));

  try {
    ensureFirebaseAvailable();

    if (!productId) {
      throw new Error('Es wurde kein Produkt ausgewaehlt.');
    }

    const currentProduct = await getZollhausProduct(productId);

    if (!currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    if (currentProduct.stockQuantity > 0) {
      throw new Error('Produkte koennen nur geloescht werden, wenn sie ausverkauft sind.');
    }

    await deleteZollhausProduct(productId);
    await deleteZollhausProductImages(currentProduct.images);

    revalidateZollhausProductPages(productId);
    redirect(buildAdminRedirect({ createMode: true, saved: 'deleted' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Das Produkt konnte nicht geloescht werden.';
    redirect(buildAdminRedirect({ productId: productId || undefined, error: message }));
  }
}

export async function archiveProductAction(formData: FormData) {
  await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect(buildAdminRedirect({ error: 'Die Anfrage konnte nicht bestaetigt werden.' }));
  }

  const productId = parseText(formData.get('productId'));

  try {
    ensureFirebaseAvailable();

    if (!productId) {
      throw new Error('Es wurde kein Produkt ausgewaehlt.');
    }

    if (formData.get('archiveConfirmed') !== 'on') {
      throw new Error('Bitte die Archivierung bestaetigen.');
    }

    const currentProduct = await getZollhausProduct(productId);

    if (!currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    await updateZollhausProduct(productId, {
      ...currentProduct,
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });

    revalidateZollhausProductPages(productId);
    redirect(buildAdminRedirect({ productId, saved: 'archived' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Das Produkt konnte nicht archiviert werden.';
    redirect(buildAdminRedirect({ productId: productId || undefined, error: message }));
  }
}

function readOrderId(formData: FormData) {
  const orderId = String(formData.get('orderId') || '').trim();

  if (!isValidZollhausOrderId(orderId)) {
    throw new Error('Die Bestellung wurde nicht gefunden.');
  }

  return orderId;
}

export async function updateOrderStatusAction(formData: FormData) {
  const session = await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin');
  }

  let orderId = '';

  try {
    orderId = readOrderId(formData);

    if (formData.get('statusConfirmed') !== 'on') {
      throw new Error('Bitte die Statusaenderung bestaetigen.');
    }

    const status = String(formData.get('status') || '').trim();
    await updateZollhausManagedOrderStatus(orderId, status, { username: session.username, role: session.role });
    revalidateZollhausPages();
    redirect(buildOrderDetailRedirect(orderId, { saved: `status-${status}` }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der Bestellstatus konnte nicht geaendert werden.';
    redirect(orderId ? buildOrderDetailRedirect(orderId, { error: message }) : buildAdminRedirect({ error: message }));
  }
}

export async function retryOrderEmailAction(formData: FormData) {
  const session = await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin');
  }

  let orderId = '';

  try {
    orderId = readOrderId(formData);

    if (formData.get('retryConfirmed') !== 'on') {
      throw new Error('Bitte den erneuten Mailversand bestaetigen.');
    }

    const result = await retryFailedOrPendingZollhausOrderEmail(orderId, { username: session.username, role: session.role });
    revalidateZollhausPages();

    if (result.status === 'sent') {
      redirect(buildOrderDetailRedirect(orderId, { saved: 'email-resent' }));
    }

    const error = result.status === 'failed' ? 'Die interne Bestellmail konnte nicht versendet werden.' : 'Die interne Bestellmail wurde nicht erneut versendet.';
    redirect(buildOrderDetailRedirect(orderId, { error }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die interne Bestellmail konnte nicht erneut versendet werden.';
    redirect(orderId ? buildOrderDetailRedirect(orderId, { error: message }) : buildAdminRedirect({ error: message }));
  }
}

export async function retryCustomerOrderEmailAction(formData: FormData) {
  const session = await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin');
  }

  let orderId = '';

  try {
    orderId = readOrderId(formData);

    if (formData.get('retryConfirmed') !== 'on') {
      throw new Error('Bitte den erneuten Mailversand bestaetigen.');
    }

    const result = await retryFailedOrPendingZollhausCustomerOrderEmail(orderId, { username: session.username, role: session.role });
    revalidateZollhausPages();

    if (result.status === 'sent') {
      redirect(buildOrderDetailRedirect(orderId, { saved: 'customer-email-resent' }));
    }

    const error = result.status === 'failed' ? 'Die Kundenbestätigung konnte nicht versendet werden.' : 'Die Kundenbestätigung wurde nicht erneut versendet.';
    redirect(buildOrderDetailRedirect(orderId, { error }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die Kundenbestätigung konnte nicht erneut versendet werden.';
    redirect(orderId ? buildOrderDetailRedirect(orderId, { error: message }) : buildAdminRedirect({ error: message }));
  }
}

export async function restoreOrderStockAction(formData: FormData) {
  const session = await requireZollhausAccess('/zollhaus/admin');

  try {
    await requireTrustedOrigin();
  } catch {
    redirect('/zollhaus/admin');
  }

  let orderId = '';

  try {
    orderId = readOrderId(formData);

    if (formData.get('restoreConfirmed') !== 'on') {
      throw new Error('Bitte die Bestandsrueckbuchung bestaetigen.');
    }

    await restoreZollhausOrderStock(orderId, { username: session.username, role: session.role });
    revalidateZollhausPages();
    redirect(buildOrderDetailRedirect(orderId, { saved: 'stock-restored' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der Bestand konnte nicht zurueckgebucht werden.';
    redirect(orderId ? buildOrderDetailRedirect(orderId, { error: message }) : buildAdminRedirect({ error: message }));
  }
}