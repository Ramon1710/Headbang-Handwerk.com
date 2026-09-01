'use server';

import { headers } from 'next/headers';
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
import { isValidIsoDateString } from '@/lib/events';
import {
  clampHomeDisplaySetting,
  type HomeDisplaySettingKey,
  HOME_DISPLAY_SETTING_SPECS,
  resolveHomeNewsLinkHref,
  validateHomeImageFile,
} from '@/lib/home';
import { normalizeExternalUrl, normalizeInternalHref, normalizeSafeText } from '@/lib/site';
import type { HomeNewsItem, MediaAsset } from '@/lib/cms/schema';

function emptyAsset(): MediaAsset {
  return {
    assetUrl: '',
    assetName: '',
    assetContentType: '',
  };
}

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function getTextareaValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

async function getReturnPath() {
  const headerStore = await headers();
  const referer = headerStore.get('referer');

  if (!referer) {
    return '/';
  }

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return '/';
  }
}

function withStatus(path: string, values: { homeSaved?: string; homeError?: string }) {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);

  params.delete('homeSaved');
  params.delete('homeError');

  if (values.homeSaved) {
    params.set('homeSaved', values.homeSaved);
  }

  if (values.homeError) {
    params.set('homeError', values.homeError);
  }

  const nextSearch = params.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

async function redirectWithError(message: string): Promise<never> {
  const returnPath = await getReturnPath();
  redirect(withStatus(returnPath, { homeError: message }));
}

async function redirectWithSaved(savedKey: string): Promise<never> {
  const returnPath = await getReturnPath();
  redirect(withStatus(returnPath, { homeSaved: savedKey }));
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin-login');
  }
}

function revalidateHome() {
  revalidatePath('/', 'layout');
  revalidatePath('/');
}

function requireText(formData: FormData, key: string, label: string) {
  const value = getValue(formData, key);

  if (!value) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  return value;
}

function parsePercent(formData: FormData, key: string, fallback: number) {
  const raw = getValue(formData, key);
  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseDisplaySetting(formData: FormData, key: HomeDisplaySettingKey) {
  return clampHomeDisplaySetting(key, getValue(formData, key) || HOME_DISPLAY_SETTING_SPECS[key].defaultValue);
}

function validateInternalLink(rawValue: string, fallback: string, label: string) {
  if (!rawValue) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  const normalized = normalizeInternalHref(rawValue, '__invalid__');

  if (!rawValue.startsWith('/') || normalized === '__invalid__' || normalized !== rawValue) {
    throw new Error(`${label} muss ein gueltiger interner Link beginnen mit / sein.`);
  }

  return normalizeInternalHref(rawValue, fallback);
}

function validateOptionalPublishedAt(value: string) {
  if (!value) {
    return '';
  }

  if (!isValidIsoDateString(value)) {
    throw new Error('Das Veroeffentlichungsdatum muss im Format JJJJ-MM-TT vorliegen.');
  }

  return value;
}

function validateOptionalNewsLink(linkLabel: string, linkHref: string) {
  if (!linkHref) {
    return { linkLabel: '', linkHref: '' };
  }

  const normalized = resolveHomeNewsLinkHref(linkHref);

  if (!normalized) {
    throw new Error('Der News-Link ist ungueltig. Erlaubt sind interne Links sowie https, mailto und tel.');
  }

  return {
    linkLabel: normalizeSafeText(linkLabel) || 'Mehr erfahren',
    linkHref: normalized,
  };
}

function toNewsImage(fileUpload: Awaited<ReturnType<typeof uploadCmsAsset>>) {
  return {
    imageUrl: fileUpload.url,
    imageName: fileUpload.name,
    imageContentType: fileUpload.contentType,
  };
}

async function uploadImageOrFail(file: File, folder: string, fileName: string) {
  const validationError = validateHomeImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  if (!hasFirebaseConfig()) {
    throw new Error('Firebase ist fuer Bild-Uploads noch nicht vollstaendig eingerichtet.');
  }

  try {
    return await uploadCmsAsset(file, folder, fileName);
  } catch (error) {
    if (isInvalidFirebaseConfigError(error)) {
      throw new Error('Firebase ist gesetzt, aber ungueltig formatiert.');
    }

    if (isFirebaseStorageBucketNotFoundError(error)) {
      throw new Error('Der Firebase-Storage-Bucket wurde nicht gefunden.');
    }

    if (isFirebaseStoragePermissionError(error)) {
      throw new Error('Der Firebase-Service-Account hat keine Schreibrechte auf den Storage-Bucket.');
    }

    if (isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
      throw new Error('Der Bild-Upload ist fehlgeschlagen.');
    }

    throw error;
  }
}

async function saveAndRedirect(content: Awaited<ReturnType<typeof getCmsContent>>, savedKey: string) {
  await saveCmsContent(content);
  revalidateHome();
  await redirectWithSaved(savedKey);
}

export async function updateHomeHeroAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    let heroImage = current.site.home.heroImage;

    if (formData.get('removeHeroImage') === 'on') {
      heroImage = emptyAsset();
    }

    const heroImageFile = formData.get('heroImageFile');

    if (heroImageFile instanceof File && heroImageFile.size > 0) {
      const uploaded = await uploadImageOrFail(heroImageFile, 'home-hero', 'hero-image');
      heroImage = {
        assetUrl: uploaded.url,
        assetName: uploaded.name,
        assetContentType: uploaded.contentType,
      };
    }

    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          heroTitle: requireText(formData, 'heroTitle', 'Die Hero-Ueberschrift'),
          heroSubtitle: requireText(formData, 'heroSubtitle', 'Die Hero-Zusatzzeile'),
          heroDescription: getTextareaValue(formData, 'heroDescription'),
          heroPrimaryCtaLabel: requireText(formData, 'heroPrimaryCtaLabel', 'Der erste Hero-Button'),
          heroPrimaryCtaHref: validateInternalLink(getValue(formData, 'heroPrimaryCtaHref'), '/veranstaltungen', 'Das erste Hero-Button-Ziel'),
          heroSecondaryCtaLabel: requireText(formData, 'heroSecondaryCtaLabel', 'Der zweite Hero-Button'),
          heroSecondaryCtaHref: validateInternalLink(getValue(formData, 'heroSecondaryCtaHref'), '/formular', 'Das zweite Hero-Button-Ziel'),
          heroImage,
          heroImageAlt: normalizeSafeText(getValue(formData, 'heroImageAlt')),
          heroImagePositionX: parsePercent(formData, 'heroImagePositionX', current.site.home.heroImagePositionX),
          heroImagePositionY: parsePercent(formData, 'heroImagePositionY', current.site.home.heroImagePositionY),
        },
      },
    };

    await saveAndRedirect(next, 'hero');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der Hero-Bereich konnte nicht gespeichert werden.';
    await redirectWithError(message);
  }
}

export async function updateHomeEventsSectionAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          eventsSectionTitle: requireText(formData, 'eventsSectionTitle', 'Die Veranstaltungs-Ueberschrift'),
          eventsSectionIntro: getTextareaValue(formData, 'eventsSectionIntro'),
          eventsSectionCtaLabel: requireText(formData, 'eventsSectionCtaLabel', 'Die Veranstaltungs-Buttonbeschriftung'),
          eventsEmptyText: requireText(formData, 'eventsEmptyText', 'Der Hinweistext bei fehlenden Veranstaltungen'),
        },
      },
    };

    await saveAndRedirect(next, 'events');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die Veranstaltungs-Vorschau konnte nicht gespeichert werden.';
    await redirectWithError(message);
  }
}

export async function updateHomeNewsSectionAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          newsSectionTitle: requireText(formData, 'newsSectionTitle', 'Die News-Ueberschrift'),
          newsSectionIntro: getTextareaValue(formData, 'newsSectionIntro'),
          newsEmptyText: requireText(formData, 'newsEmptyText', 'Der Hinweistext bei fehlenden News'),
        },
      },
    };

    await saveAndRedirect(next, 'news-section');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die News-Sektion konnte nicht gespeichert werden.';
    await redirectWithError(message);
  }
}

export async function addHomeNewsAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const title = requireText(formData, 'title', 'Der News-Titel');
    const excerpt = requireText(formData, 'excerpt', 'Der News-Kurztext');
    const publishedAt = validateOptionalPublishedAt(getValue(formData, 'publishedAt'));
    const { linkLabel, linkHref } = validateOptionalNewsLink(getValue(formData, 'linkLabel'), getValue(formData, 'linkHref'));
    const imageAlt = normalizeSafeText(getValue(formData, 'imageAlt'));
    let imageFields = { imageUrl: '', imageName: '', imageContentType: '' };

    const imageFile = formData.get('imageFile');
    if (imageFile instanceof File && imageFile.size > 0) {
      imageFields = toNewsImage(await uploadImageOrFail(imageFile, 'home-news', `news-${Date.now()}`));
    }

    const nextItem: HomeNewsItem = {
      id: `home-news-${crypto.randomUUID()}`,
      title,
      excerpt,
      publishedAt,
      linkLabel,
      linkHref,
      visible: formData.get('visible') === 'on',
      imageAlt,
      ...imageFields,
    };

    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          newsItems: [nextItem, ...current.site.home.newsItems],
        },
      },
    };

    await saveAndRedirect(next, 'news-added');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der News-Eintrag konnte nicht angelegt werden.';
    await redirectWithError(message);
  }
}

export async function updateHomeNewsAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const newsId = requireText(formData, 'newsId', 'Die News-ID');
    const newsItems = [...current.site.home.newsItems];
    const index = newsItems.findIndex((item) => item.id === newsId);

    if (index < 0) {
      throw new Error('Der News-Eintrag wurde nicht gefunden.');
    }

    const currentItem = newsItems[index];
    let nextImage = {
      imageUrl: currentItem.imageUrl,
      imageName: currentItem.imageName || '',
      imageContentType: currentItem.imageContentType || '',
    };

    if (formData.get('removeImage') === 'on') {
      nextImage = { imageUrl: '', imageName: '', imageContentType: '' };
    }

    const imageFile = formData.get('imageFile');
    if (imageFile instanceof File && imageFile.size > 0) {
      nextImage = toNewsImage(await uploadImageOrFail(imageFile, 'home-news', newsId));
    }

    const { linkLabel, linkHref } = validateOptionalNewsLink(getValue(formData, 'linkLabel'), getValue(formData, 'linkHref'));

    newsItems[index] = {
      ...currentItem,
      title: requireText(formData, 'title', 'Der News-Titel'),
      excerpt: requireText(formData, 'excerpt', 'Der News-Kurztext'),
      publishedAt: validateOptionalPublishedAt(getValue(formData, 'publishedAt')),
      visible: formData.get('visible') === 'on',
      linkLabel,
      linkHref,
      imageAlt: normalizeSafeText(getValue(formData, 'imageAlt')),
      ...nextImage,
    };

    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          newsItems,
        },
      },
    };

    await saveAndRedirect(next, 'news-updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der News-Eintrag konnte nicht gespeichert werden.';
    await redirectWithError(message);
  }
}

export async function deleteHomeNewsAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const newsId = requireText(formData, 'newsId', 'Die News-ID');
    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          newsItems: current.site.home.newsItems.filter((item) => item.id !== newsId),
        },
      },
    };

    await saveAndRedirect(next, 'news-deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der News-Eintrag konnte nicht geloescht werden.';
    await redirectWithError(message);
  }
}

export async function moveHomeNewsAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const newsId = requireText(formData, 'newsId', 'Die News-ID');
    const direction = getValue(formData, 'direction');
    const newsItems = [...current.site.home.newsItems];
    const index = newsItems.findIndex((item) => item.id === newsId);

    if (index < 0) {
      throw new Error('Der News-Eintrag wurde nicht gefunden.');
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newsItems.length) {
      await redirectWithSaved('news-sorted');
    }

    const [entry] = newsItems.splice(index, 1);
    newsItems.splice(targetIndex, 0, entry);

    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          newsItems,
        },
      },
    };

    await saveAndRedirect(next, 'news-sorted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die News-Reihenfolge konnte nicht geaendert werden.';
    await redirectWithError(message);
  }
}

export async function updateHomeMembershipAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    let membershipImage = current.site.home.membershipImage;

    if (formData.get('removeMembershipImage') === 'on') {
      membershipImage = emptyAsset();
    }

    const membershipImageFile = formData.get('membershipImageFile');

    if (membershipImageFile instanceof File && membershipImageFile.size > 0) {
      const uploaded = await uploadImageOrFail(membershipImageFile, 'home-membership', 'membership-image');
      membershipImage = {
        assetUrl: uploaded.url,
        assetName: uploaded.name,
        assetContentType: uploaded.contentType,
      };
    }

    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          membershipTitle: requireText(formData, 'membershipTitle', 'Die Mitglieder-Ueberschrift'),
          membershipBody: requireText(formData, 'membershipBody', 'Der Mitglieder-Text'),
          membershipCtaLabel: requireText(formData, 'membershipCtaLabel', 'Die Mitglieder-Buttonbeschriftung'),
          membershipCtaHref: validateInternalLink(getValue(formData, 'membershipCtaHref'), '/formular', 'Das Mitglieder-Button-Ziel'),
          membershipImage,
          membershipImageAlt: normalizeSafeText(getValue(formData, 'membershipImageAlt')),
          membershipImagePositionX: parsePercent(formData, 'membershipImagePositionX', current.site.home.membershipImagePositionX),
          membershipImagePositionY: parsePercent(formData, 'membershipImagePositionY', current.site.home.membershipImagePositionY),
        },
      },
    };

    await saveAndRedirect(next, 'membership');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Der Mitgliederbereich konnte nicht gespeichert werden.';
    await redirectWithError(message);
  }
}

export async function updateHomeDisplaySettingsAction(formData: FormData) {
  await assertAdmin();

  try {
    const current = await getCmsContent();
    const next = {
      ...current,
      site: {
        ...current.site,
        home: {
          ...current.site.home,
          displaySettings: {
            heroHeightDesktop: parseDisplaySetting(formData, 'heroHeightDesktop'),
            heroHeightMobile: parseDisplaySetting(formData, 'heroHeightMobile'),
            heroTitleSizeDesktop: parseDisplaySetting(formData, 'heroTitleSizeDesktop'),
            heroTitleSizeMobile: parseDisplaySetting(formData, 'heroTitleSizeMobile'),
            sectionTitleSizeDesktop: parseDisplaySetting(formData, 'sectionTitleSizeDesktop'),
            sectionTitleSizeMobile: parseDisplaySetting(formData, 'sectionTitleSizeMobile'),
            sectionSpacingDesktop: parseDisplaySetting(formData, 'sectionSpacingDesktop'),
            sectionSpacingMobile: parseDisplaySetting(formData, 'sectionSpacingMobile'),
            cardGap: parseDisplaySetting(formData, 'cardGap'),
            eventImageHeight: parseDisplaySetting(formData, 'eventImageHeight'),
            newsImageHeight: parseDisplaySetting(formData, 'newsImageHeight'),
            membershipMinHeight: parseDisplaySetting(formData, 'membershipMinHeight'),
          },
        },
      },
    };

    await saveAndRedirect(next, 'display');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Die Darstellungswerte konnten nicht gespeichert werden.';
    await redirectWithError(message);
  }
}