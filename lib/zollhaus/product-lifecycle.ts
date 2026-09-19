import type { ZollhausCheckoutStore } from '@/lib/zollhaus/checkout';
import { normalizeZollhausProduct } from '@/lib/zollhaus/validation';
import type { ZollhausAdminActorRole, ZollhausProduct } from '@/lib/zollhaus/types';

export interface ZollhausProductActor {
  username: string;
  role: ZollhausAdminActorRole;
}

interface ZollhausProductLifecycleOptions {
  store?: ZollhausCheckoutStore;
  now?: () => Date;
}

export interface ZollhausProductLifecycleResult {
  action: 'deleted' | 'archived';
  product: ZollhausProduct;
  imagesToDelete: ZollhausProduct['images'];
}

function isValidZollhausProductId(productId: string) {
  return /^[A-Za-z0-9_-]{1,120}$/.test(productId);
}

async function resolveProductStore(store?: ZollhausCheckoutStore) {
  if (store) {
    return store;
  }

  const module = await import('@/lib/zollhaus/checkout-store');
  return module.getZollhausCheckoutStore();
}

function productHasOrderReference(productId: string, orders: Array<{ items: Array<{ productId: string }> }>) {
  return orders.some((order) => order.items.some((item) => item.productId === productId));
}

function buildArchivedProduct(product: ZollhausProduct, actor: ZollhausProductActor, nowIso: string) {
  return normalizeZollhausProduct(
    {
      ...product,
      status: 'archived',
      archivedAt: product.archivedAt || nowIso,
      archivedBy: actor.username,
      archivedByRole: actor.role,
    },
    { existing: product, now: nowIso },
  );
}

export async function removeOrArchiveZollhausProduct(
  productId: string,
  actor: ZollhausProductActor,
  options?: ZollhausProductLifecycleOptions,
): Promise<ZollhausProductLifecycleResult> {
  if (!isValidZollhausProductId(productId)) {
    throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
  }

  const store = await resolveProductStore(options?.store);
  const nowIso = (options?.now?.() ?? new Date()).toISOString();

  return store.runTransaction(async (transaction) => {
    const currentProduct = (await transaction.getProducts([productId])).get(productId) || null;

    if (!currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    const orders = await transaction.listOrders();

    if (productHasOrderReference(productId, orders)) {
      const archivedProduct = buildArchivedProduct(currentProduct, actor, nowIso);
      await transaction.saveProduct(archivedProduct);

      return {
        action: 'archived',
        product: archivedProduct,
        imagesToDelete: [],
      } satisfies ZollhausProductLifecycleResult;
    }

    await transaction.deleteProduct(productId);

    return {
      action: 'deleted',
      product: currentProduct,
      imagesToDelete: currentProduct.images,
    } satisfies ZollhausProductLifecycleResult;
  });
}

export async function archiveZollhausProductForAdmin(
  productId: string,
  actor: ZollhausProductActor,
  options?: ZollhausProductLifecycleOptions,
) {
  if (!isValidZollhausProductId(productId)) {
    throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
  }

  const store = await resolveProductStore(options?.store);
  const nowIso = (options?.now?.() ?? new Date()).toISOString();

  return store.runTransaction(async (transaction) => {
    const currentProduct = (await transaction.getProducts([productId])).get(productId) || null;

    if (!currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    const archivedProduct = buildArchivedProduct(currentProduct, actor, nowIso);
    await transaction.saveProduct(archivedProduct);
    return archivedProduct;
  });
}

export async function restoreZollhausProductForAdmin(
  productId: string,
  actor: ZollhausProductActor,
  options?: ZollhausProductLifecycleOptions,
) {
  if (!isValidZollhausProductId(productId)) {
    throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
  }

  const store = await resolveProductStore(options?.store);
  const nowIso = (options?.now?.() ?? new Date()).toISOString();

  return store.runTransaction(async (transaction) => {
    const currentProduct = (await transaction.getProducts([productId])).get(productId) || null;

    if (!currentProduct) {
      throw new Error('Das ausgewaehlte Produkt wurde nicht gefunden.');
    }

    if (currentProduct.status !== 'archived') {
      throw new Error('Nur archivierte Produkte koennen wiederhergestellt werden.');
    }

    const restoredProduct = normalizeZollhausProduct(
      {
        ...currentProduct,
        status: 'inactive',
        restoredAt: nowIso,
        restoredBy: actor.username,
        restoredByRole: actor.role,
      },
      { existing: currentProduct, now: nowIso },
    );

    await transaction.saveProduct(restoredProduct);
    return restoredProduct;
  });
}