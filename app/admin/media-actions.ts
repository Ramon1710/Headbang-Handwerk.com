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
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';
import type { MediaAsset } from '@/lib/cms/schema';

function emptyAsset(): MediaAsset {
  return {
    assetUrl: '',
    assetName: '',
    assetContentType: '',
  };
}

async function assertAdmin(nextPath: string) {
  if (!(await isAdminAuthenticated())) {
    redirect(`/admin-login?next=${encodeURIComponent(nextPath)}`);
  }
}

function redirectForUploadError(basePath: string, code: string, error: unknown): never {
  if (isInvalidFirebaseConfigError(error)) {
    redirect(`${basePath}?mediaError=${code}-invalid-config`);
  }

  if (isFirebaseStorageBucketNotFoundError(error)) {
    redirect(`${basePath}?mediaError=${code}-bucket`);
  }

  if (isFirebaseStoragePermissionError(error)) {
    redirect(`${basePath}?mediaError=${code}-permission`);
  }

  if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    redirect(`${basePath}?mediaError=${code}`);
  }

  throw error;
}

export async function updateHomeMediaAction(formData: FormData) {
  await assertAdmin('/');

  if (!hasFirebaseConfig()) {
    redirect('/?mediaError=missing-config');
  }

  const current = await getCmsContent();
  let logo = current.site.logo;
  let heroImage = current.site.home.heroImage;
  let backgroundImage = current.site.home.backgroundImage;

  if (formData.get('removeLogoAsset') === 'on') {
    logo = emptyAsset();
  }

  if (formData.get('removeHeroImage') === 'on') {
    heroImage = emptyAsset();
  }

  if (formData.get('removeBackgroundImage') === 'on') {
    backgroundImage = emptyAsset();
  }

  const logoAssetFile = formData.get('logoAssetFile');
  const heroImageFile = formData.get('heroImageFile');
  const backgroundImageFile = formData.get('backgroundImageFile');

  if (logoAssetFile instanceof File && logoAssetFile.size > 0) {
    try {
      const uploadedAsset = await uploadCmsAsset(logoAssetFile, 'logo', 'hauptlogo');
      logo = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForUploadError('/', 'home-logo-upload', error);
    }
  }

  if (heroImageFile instanceof File && heroImageFile.size > 0) {
    try {
      const uploadedAsset = await uploadCmsAsset(heroImageFile, 'home', 'startseitenbild');
      heroImage = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForUploadError('/', 'home-hero-upload', error);
    }
  }

  if (backgroundImageFile instanceof File && backgroundImageFile.size > 0) {
    try {
      const uploadedAsset = await uploadCmsAsset(backgroundImageFile, 'home', 'hintergrundbild');
      backgroundImage = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForUploadError('/', 'home-background-upload', error);
    }
  }

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      logo,
      home: {
        ...current.site.home,
        heroImage,
        backgroundImage,
      },
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/');
  redirect('/?mediaSaved=home');
}

export async function updateAboutTeamImagesAction(formData: FormData) {
  await assertAdmin('/ueber-uns');

  if (!hasFirebaseConfig()) {
    redirect('/ueber-uns?mediaError=missing-config');
  }

  const current = await getCmsContent();
  const nextTeamImages = [...current.site.about.teamImages];

  for (let index = 0; index < current.site.about.teamRoles.length; index += 1) {
    if (formData.get(`removeTeamImage${index}`) === 'on') {
      nextTeamImages[index] = emptyAsset();
    }

    const imageFile = formData.get(`teamImageFile${index}`);

    if (!(imageFile instanceof File) || imageFile.size <= 0) {
      continue;
    }

    try {
      const uploadedAsset = await uploadCmsAsset(imageFile, 'about-team', `team-${index + 1}`);
      nextTeamImages[index] = {
        assetUrl: uploadedAsset.url,
        assetName: uploadedAsset.name,
        assetContentType: uploadedAsset.contentType,
      };
    } catch (error) {
      redirectForUploadError('/ueber-uns', `about-team-upload-${index}`, error);
    }
  }

  await saveCmsContent({
    ...current,
    site: {
      ...current.site,
      about: {
        ...current.site.about,
        teamImages: nextTeamImages,
      },
    },
  });

  revalidatePath('/', 'layout');
  revalidatePath('/ueber-uns');
  redirect('/ueber-uns?adminSaved=team-images');
}