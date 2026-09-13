import 'server-only';

import { hasFirebaseConfig } from '@/lib/cms/firebase';
import { getLocalZollhausFixtureProducts } from '@/lib/zollhaus/public-fixtures';
import { getZollhausProduct, listZollhausProducts } from '@/lib/zollhaus/products';
import { isValidPublicZollhausProductId, toPublicZollhausProduct, toPublicZollhausProducts } from '@/lib/zollhaus/public-products';

function shouldUseLocalFixtures() {
  return process.env.ZOLLHAUS_LOCAL_FIXTURES === '1';
}

export async function listPublicZollhausProducts() {
  const products = shouldUseLocalFixtures() ? getLocalZollhausFixtureProducts() : hasFirebaseConfig() ? await listZollhausProducts() : [];
  return toPublicZollhausProducts(products);
}

export async function getPublicZollhausProductById(productId: string) {
  if (!isValidPublicZollhausProductId(productId)) {
    return null;
  }

  const product = shouldUseLocalFixtures()
    ? getLocalZollhausFixtureProducts().find((entry) => entry.id === productId) || null
    : hasFirebaseConfig()
    ? await getZollhausProduct(productId)
    : null;

  if (!product || product.status !== 'active') {
    return null;
  }

  return toPublicZollhausProduct(product);
}
