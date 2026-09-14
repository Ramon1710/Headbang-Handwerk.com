import 'server-only';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirebaseDb } from '@/lib/cms/firebase';
import { normalizeZollhausProduct } from '@/lib/zollhaus/validation';
import { ZOLLHAUS_PARTNER_SITE_ID, type ZollhausProduct } from '@/lib/zollhaus/types';

function getDb(db?: Firestore) {
  return db ?? getFirebaseDb();
}

function getProductsCollection(db?: Firestore) {
  return getDb(db).collection('partnerSites').doc(ZOLLHAUS_PARTNER_SITE_ID).collection('products');
}

function readProductSnapshot(snapshot: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return normalizeZollhausProduct({ id: snapshot.id, ...(snapshot.data() || {}) });
}

export async function listZollhausProducts(options?: { includeArchived?: boolean; db?: Firestore }) {
  const snapshot = await getProductsCollection(options?.db).orderBy('updatedAt', 'desc').get();
  const products = snapshot.docs
    .map((entry) => readProductSnapshot(entry))
    .filter((entry): entry is ZollhausProduct => Boolean(entry));

  if (options?.includeArchived) {
    return products;
  }

  return products.filter((product) => product.status === 'active');
}

export async function getZollhausProduct(productId: string, db?: Firestore) {
  const snapshot = await getProductsCollection(db).doc(productId).get();
  return readProductSnapshot(snapshot);
}

export async function createZollhausProduct(input: Omit<ZollhausProduct, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, db?: Firestore) {
  const collection = getProductsCollection(db);
  const document = input.id ? collection.doc(input.id) : collection.doc();
  const product = normalizeZollhausProduct({ ...input, id: document.id, createdAt: new Date().toISOString() });

  await document.set(product, { merge: false });
  return product;
}

export async function updateZollhausProduct(productId: string, input: Partial<ZollhausProduct>, db?: Firestore) {
  const current = await getZollhausProduct(productId, db);

  if (!current) {
    throw new Error('Zollhaus-Produkt wurde nicht gefunden.');
  }

  const product = normalizeZollhausProduct({ ...current, ...input, id: productId }, { existing: current });
  await getProductsCollection(db).doc(productId).set(product, { merge: false });

  return product;
}

export async function deleteZollhausProduct(productId: string, db?: Firestore) {
  const current = await getZollhausProduct(productId, db);

  if (!current) {
    throw new Error('Zollhaus-Produkt wurde nicht gefunden.');
  }

  await getProductsCollection(db).doc(productId).delete();
}

export async function archiveZollhausProduct(productId: string, db?: Firestore) {
  return updateZollhausProduct(
    productId,
    {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    },
    db,
  );
}
