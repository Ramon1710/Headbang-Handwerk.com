'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import type { SponsorPackage } from '@/lib/types';

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

function ensurePackageId(packages: SponsorPackage[], requestedId: string, name: string) {
  const base = slugify(requestedId || name || `package-${Date.now()}`) || `package-${Date.now()}`;

  if (!packages.some((pkg) => pkg.id === base)) {
    return base;
  }

  let counter = 2;
  let nextId = `${base}-${counter}`;

  while (packages.some((pkg) => pkg.id === nextId)) {
    counter += 1;
    nextId = `${base}-${counter}`;
  }

  return nextId;
}

function parsePrice(value: string) {
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseFeatures(value: string) {
  return value
    .split(/\r?\n/)
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function parsePackageFromFormData(formData: FormData, existingId?: string): SponsorPackage {
  const name = sanitizeText(formData.get('name'));
  const price = parsePrice(sanitizeText(formData.get('price')));
  const visibility = sanitizeText(formData.get('visibility'));
  const logoSize = sanitizeText(formData.get('logoSize'));
  const placement = sanitizeText(formData.get('placement'));
  const features = parseFeatures(sanitizeText(formData.get('features')));
  const highlighted = formData.get('highlighted') === 'on';

  return {
    id: existingId || '',
    name,
    price,
    features,
    visibility,
    logoSize,
    placement,
    highlighted,
  };
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/sponsoren');
  }
}

async function persistSponsorPackages(sponsorPackages: SponsorPackage[]) {
  const current = await getCmsContent();

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      sponsorPackages,
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/sponsoren');
  revalidatePath('/sponsoren/checkout');
}

function validatePackage(pkg: SponsorPackage) {
  return Boolean(pkg.name) && Number.isFinite(pkg.price) && pkg.price >= 0 && pkg.features.length > 0;
}

export async function addSponsorPackageAction(formData: FormData) {
  await assertAdmin();

  const current = await getCmsContent();
  const nextPackage = parsePackageFromFormData(formData);

  if (!validatePackage(nextPackage)) {
    redirect('/sponsoren?adminError=missing-package-fields');
  }

  nextPackage.id = ensurePackageId(current.site.sponsorPackages, sanitizeText(formData.get('id')), nextPackage.name);

  await persistSponsorPackages([...current.site.sponsorPackages, nextPackage]);
  redirect('/sponsoren?adminSaved=package-added');
}

export async function updateSponsorPackageAction(formData: FormData) {
  await assertAdmin();

  const packageId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  if (!packageId) {
    redirect('/sponsoren?adminError=missing-package-id');
  }

  const existingPackage = current.site.sponsorPackages.find((pkg) => pkg.id === packageId);

  if (!existingPackage) {
    redirect('/sponsoren?adminError=missing-package');
  }

  const nextPackage = parsePackageFromFormData(formData, packageId);

  if (!validatePackage(nextPackage)) {
    redirect('/sponsoren?adminError=missing-package-fields');
  }

  await persistSponsorPackages(
    current.site.sponsorPackages.map((pkg) => (pkg.id === packageId ? { ...existingPackage, ...nextPackage } : pkg))
  );

  redirect('/sponsoren?adminSaved=package-updated');
}

export async function removeSponsorPackageAction(formData: FormData) {
  await assertAdmin();

  const packageId = sanitizeText(formData.get('id'));
  const current = await getCmsContent();

  await persistSponsorPackages(current.site.sponsorPackages.filter((pkg) => pkg.id !== packageId));
  redirect('/sponsoren?adminSaved=package-removed');
}