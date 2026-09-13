import 'server-only';

import type { Firestore } from 'firebase-admin/firestore';
import { getFirebaseDb } from '@/lib/cms/firebase';
import { normalizeZollhausShopSettings } from '@/lib/zollhaus/validation';
import { ZOLLHAUS_PARTNER_SITE_ID } from '@/lib/zollhaus/types';

export function buildDefaultZollhausShopSettings(now = new Date().toISOString()) {
  return normalizeZollhausShopSettings({
    shopName: 'Zollhaus Shop',
    orderNumberPrefix: 'ZH',
    checkoutEnabled: true,
    supportEmail: 'shop@zollhaus.invalid',
    createdAt: now,
  });
}

function getDb(db?: Firestore) {
  return db ?? getFirebaseDb();
}

function getSettingsDocument(db?: Firestore) {
  return getDb(db).collection('partnerSites').doc(ZOLLHAUS_PARTNER_SITE_ID).collection('settings').doc('shop');
}

export async function getZollhausShopSettings(db?: Firestore) {
  const snapshot = await getSettingsDocument(db).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeZollhausShopSettings(snapshot.data() || {});
}

export async function getResolvedZollhausShopSettings(db?: Firestore) {
  const settings = await getZollhausShopSettings(db);

  if (!settings) {
    return buildDefaultZollhausShopSettings();
  }

  return normalizeZollhausShopSettings(settings, { existing: settings });
}

export async function saveZollhausShopSettings(input: Parameters<typeof normalizeZollhausShopSettings>[0], db?: Firestore) {
  const current = await getZollhausShopSettings(db);
  const settings = normalizeZollhausShopSettings(input, { existing: current || undefined });

  await getSettingsDocument(db).set(settings, { merge: false });
  return settings;
}
