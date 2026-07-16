import { cache } from 'react';
import { defaultCmsContent } from './default-content';
import {
  getFirebaseDb,
  hasFirebaseConfig,
  isFirebaseAuthError,
  isInvalidFirebaseConfigError,
  toFirebaseAuthError,
} from './firebase';
import { normalizeEvent } from '@/lib/event-stand';
import { emptyLiveEditorContent } from './live-editor';
import type { CmsContent, GalleryFolder, GalleryImage, MediaAsset } from './schema';

const READONLY_FALLBACK_ERROR = 'CMS_READONLY_FALLBACK';
const INVALID_FIREBASE_SAVE_ERROR = 'CMS_INVALID_FIREBASE_SAVE';
const FIREBASE_AUTH_SAVE_ERROR = 'CMS_FIREBASE_AUTH_SAVE';

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

async function getLocalPaths() {
  const path = await import('node:path');
  const dir = path.join(process.cwd(), '.cms');

  return {
    dir,
    file: path.join(dir, 'content.json'),
  };
}

function isReadonlyFilesystemError(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const code = String(error.code);
  return code === 'EROFS' || code === 'EACCES' || code === 'EPERM';
}

function normalizeStringList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const entries = value
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean);

    return entries.length ? entries : undefined;
  }

  if (typeof value === 'string') {
    const entries = value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    return entries.length ? entries : undefined;
  }

  return undefined;
}

function normalizePercentage(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function normalizeMerchandiseProduct(product: unknown) {
  if (!product || typeof product !== 'object') {
    return null;
  }

  const candidate = product as Record<string, unknown>;
  const name = String(candidate.name ?? '').trim();
  const description = String(candidate.description ?? '').trim();
  const rawPrice = candidate.price;
  const parsedPrice =
    typeof rawPrice === 'number'
      ? rawPrice
      : Number.parseFloat(String(rawPrice ?? '').replace(',', '.'));

  if (!name || !description || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return null;
  }

  const id = String(candidate.id ?? '').trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!id) {
    return null;
  }

  const badge = String(candidate.badge ?? '').trim();
  const imageUrl = String(candidate.imageUrl ?? '').trim();
  const galleryImageUrls = Array.isArray(candidate.galleryImageUrls)
    ? candidate.galleryImageUrls.map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 5)
    : [];
  const estimatedDeliveryTime = String(candidate.estimatedDeliveryTime ?? '').trim();
  const stripePriceId = String(candidate.stripePriceId ?? '').trim();

  return {
    id,
    name,
    description,
    price: parsedPrice,
    ...(badge ? { badge } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(galleryImageUrls.length ? { galleryImageUrls } : {}),
    ...(normalizeStringList(candidate.sizes) ? { sizes: normalizeStringList(candidate.sizes) } : {}),
    ...(normalizeStringList(candidate.colors) ? { colors: normalizeStringList(candidate.colors) } : {}),
    ...(estimatedDeliveryTime ? { estimatedDeliveryTime } : {}),
    ...(stripePriceId ? { stripePriceId } : {}),
  };
}

function normalizeMediaAsset(asset: unknown): MediaAsset {
  if (!asset || typeof asset !== 'object') {
    return { assetUrl: '', assetName: '', assetContentType: '' };
  }

  const candidate = asset as Record<string, unknown>;

  return {
    assetUrl: String(candidate.assetUrl ?? '').trim(),
    assetName: String(candidate.assetName ?? '').trim(),
    assetContentType: String(candidate.assetContentType ?? '').trim(),
  };
}

function normalizeGalleryImage(image: unknown): GalleryImage | null {
  if (!image || typeof image !== 'object') {
    return null;
  }

  const candidate = image as Record<string, unknown>;
  const id = String(candidate.id ?? '').trim();
  const asset = normalizeMediaAsset(candidate);

  if (!id || !asset.assetUrl) {
    return null;
  }

  return {
    id,
    ...asset,
  };
}

function normalizeGalleryFolder(folder: unknown): GalleryFolder | null {
  if (!folder || typeof folder !== 'object') {
    return null;
  }

  const candidate = folder as Record<string, unknown>;
  const id = String(candidate.id ?? '').trim();
  const title = String(candidate.title ?? '').trim();

  if (!id || !title) {
    return null;
  }

  const images = Array.isArray(candidate.images)
    ? candidate.images
        .map(normalizeGalleryImage)
        .filter((image): image is NonNullable<ReturnType<typeof normalizeGalleryImage>> => Boolean(image))
    : [];

  return {
    id,
    title,
    coverImage: normalizeMediaAsset(candidate.coverImage),
    images,
  };
}

function normalizePartnerEntry(partner: unknown) {
  if (!partner || typeof partner !== 'object') {
    return null;
  }

  const candidate = partner as Record<string, unknown>;
  const id = String(candidate.id ?? '').trim();
  const name = String(candidate.name ?? '').trim();
  const website = String(candidate.website ?? '').trim();
  const description = String(candidate.description ?? '').trim();
  const logoBoxBackground = String(candidate.logoBoxBackground ?? '').trim();
  const rawOpacity =
    typeof candidate.logoBoxOpacity === 'number'
      ? candidate.logoBoxOpacity
      : Number.parseFloat(String(candidate.logoBoxOpacity ?? ''));

  if (!id || !name || !description) {
    return null;
  }

  return {
    id,
    name,
    website,
    description,
    logo: normalizeMediaAsset(candidate.logo),
    ...(logoBoxBackground ? { logoBoxBackground } : {}),
    ...(Number.isFinite(rawOpacity) ? { logoBoxOpacity: Math.min(100, Math.max(0, Math.round(rawOpacity))) } : {}),
  };
}

async function readFromFirebase(): Promise<CmsContent | null> {
  try {
    const db = getFirebaseDb();
    const snapshot = await db.collection('cms').doc('site').get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as CmsContent;
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw toFirebaseAuthError();
    }

    throw error;
  }
}

async function writeToFirebase(content: CmsContent) {
  try {
    const db = getFirebaseDb();
    await db.collection('cms').doc('site').set(content, { merge: true });
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw toFirebaseAuthError();
    }

    throw error;
  }
}

async function ensureLocalFile() {
  try {
    const fs = await import('node:fs/promises');
    const paths = await getLocalPaths();

    await fs.mkdir(paths.dir, { recursive: true });

    try {
      await fs.access(paths.file);
    } catch {
      await fs.writeFile(paths.file, JSON.stringify(defaultCmsContent, null, 2), 'utf8');
    }
  } catch (error) {
    if (isReadonlyFilesystemError(error)) {
      throw new Error(READONLY_FALLBACK_ERROR);
    }

    throw error;
  }
}

async function readFromFile() {
  await ensureLocalFile();
  const fs = await import('node:fs/promises');
  const paths = await getLocalPaths();
  const raw = await fs.readFile(paths.file, 'utf8');
  return JSON.parse(raw) as CmsContent;
}

async function writeToFile(content: CmsContent) {
  await ensureLocalFile();
  const fs = await import('node:fs/promises');
  const paths = await getLocalPaths();
  await fs.writeFile(paths.file, JSON.stringify(content, null, 2), 'utf8');
}

function normalizeFooterSocialLinks(content: CmsContent) {
  const defaults = defaultCmsContent.site.footer.socialLinks;
  const currentLinks = Array.isArray(content.site.footer?.socialLinks) ? content.site.footer.socialLinks : [];

  return defaults.map((defaultLink) => {
    const currentLink = currentLinks.find((link) => link.platform === defaultLink.platform);
    const href = String(currentLink?.href ?? '').trim();
    const normalizedHref = defaultLink.platform === 'instagram' ? defaultLink.href : href || defaultLink.href;

    return {
      ...defaultLink,
      ...currentLink,
      href: normalizedHref,
    };
  });
}

function normalizeContent(content: CmsContent): CmsContent {
  return {
    theme: { ...defaultCmsContent.theme, ...content.theme },
    site: {
      ...defaultCmsContent.site,
      ...content.site,
      seo: { ...defaultCmsContent.site.seo, ...content.site.seo },
      events: Array.isArray(content.site.events) ? content.site.events.map(normalizeEvent) : defaultCmsContent.site.events.map(normalizeEvent),
      sponsorPackages: Array.isArray(content.site.sponsorPackages)
        ? content.site.sponsorPackages
        : defaultCmsContent.site.sponsorPackages,
      liveEditor: {
        ...emptyLiveEditorContent,
        ...defaultCmsContent.site.liveEditor,
        ...content.site.liveEditor,
        richText: {
          ...emptyLiveEditorContent.richText,
          ...defaultCmsContent.site.liveEditor.richText,
          ...(content.site.liveEditor?.richText || {}),
        },
        boxStyles: {
          ...emptyLiveEditorContent.boxStyles,
          ...defaultCmsContent.site.liveEditor.boxStyles,
          ...(content.site.liveEditor?.boxStyles || {}),
        },
      },
      home: {
        ...defaultCmsContent.site.home,
        ...content.site.home,
        heroImage: normalizeMediaAsset(content.site.home?.heroImage),
        backgroundImage: normalizeMediaAsset(content.site.home?.backgroundImage),
        instagramVideo: normalizeMediaAsset(content.site.home?.instagramVideo),
        newsTitle: String(content.site.home?.newsTitle ?? defaultCmsContent.site.home.newsTitle).trim() || defaultCmsContent.site.home.newsTitle,
        newsParagraphs: Array.isArray(content.site.home?.newsParagraphs)
          ? content.site.home.newsParagraphs.map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 1)
          : defaultCmsContent.site.home.newsParagraphs,
        newsImages: Array.isArray(content.site.home?.newsImages)
          ? content.site.home.newsImages
              .map(normalizeMediaAsset)
              .filter((asset) => Boolean(asset.assetUrl))
              .slice(0, 1)
          : defaultCmsContent.site.home.newsImages,
        newsImagePositionX: normalizePercentage(content.site.home?.newsImagePositionX, defaultCmsContent.site.home.newsImagePositionX),
        newsImagePositionY: normalizePercentage(content.site.home?.newsImagePositionY, defaultCmsContent.site.home.newsImagePositionY),
      },
      sponsors: { ...defaultCmsContent.site.sponsors, ...content.site.sponsors },
      about: {
        ...defaultCmsContent.site.about,
        ...content.site.about,
        teamImages: Array.isArray(content.site.about?.teamImages)
          ? content.site.about.teamImages
          : defaultCmsContent.site.about.teamImages,
      },
      contact: { ...defaultCmsContent.site.contact, ...content.site.contact },
      stand: { ...defaultCmsContent.site.stand, ...content.site.stand },
      merchandise: {
        ...defaultCmsContent.site.merchandise,
        ...content.site.merchandise,
        products: Array.isArray(content.site.merchandise?.products)
          ? content.site.merchandise.products
              .map(normalizeMerchandiseProduct)
              .filter((product): product is NonNullable<ReturnType<typeof normalizeMerchandiseProduct>> => Boolean(product))
          : defaultCmsContent.site.merchandise.products,
      },
      partners: Array.isArray(content.site.partners)
        ? content.site.partners
            .map(normalizePartnerEntry)
            .filter((partner): partner is NonNullable<ReturnType<typeof normalizePartnerEntry>> => Boolean(partner))
        : defaultCmsContent.site.partners,
      gallery: {
        ...defaultCmsContent.site.gallery,
        ...content.site.gallery,
        folders: Array.isArray(content.site.gallery?.folders)
          ? content.site.gallery.folders
              .map(normalizeGalleryFolder)
              .filter((folder): folder is NonNullable<ReturnType<typeof normalizeGalleryFolder>> => Boolean(folder))
          : defaultCmsContent.site.gallery.folders,
      },
      footer: {
        ...defaultCmsContent.site.footer,
        ...content.site.footer,
        socialLinks: normalizeFooterSocialLinks(content),
      },
    },
  };
}


export const getCmsContent = cache(async (): Promise<CmsContent> => {
  if (!hasFirebaseConfig() && isVercelRuntime()) {
    return defaultCmsContent;
  }

  let content: CmsContent | null;

  try {
    content = hasFirebaseConfig() ? await readFromFirebase() : await readFromFile();
  } catch (error) {
    if (isFirebaseAuthError(error) && isVercelRuntime()) {
      return defaultCmsContent;
    }

    if (isInvalidFirebaseConfigError(error) && isVercelRuntime()) {
      return defaultCmsContent;
    }

    if (!hasFirebaseConfig() && error instanceof Error && error.message === READONLY_FALLBACK_ERROR) {
      return defaultCmsContent;
    }

    throw error;
  }

  if (!content) {
    if (hasFirebaseConfig()) {
      await writeToFirebase(defaultCmsContent);
    }

    return defaultCmsContent;
  }

  return normalizeContent(content);
});

export async function saveCmsContent(content: CmsContent) {
  const normalized = normalizeContent(content);

  if (hasFirebaseConfig()) {
    try {
      await writeToFirebase(normalized);
    } catch (error) {
      if (isFirebaseAuthError(error) && isVercelRuntime()) {
        throw new Error(FIREBASE_AUTH_SAVE_ERROR);
      }

      if (isInvalidFirebaseConfigError(error) && isVercelRuntime()) {
        throw new Error(INVALID_FIREBASE_SAVE_ERROR);
      }

      throw error;
    }

    return;
  }

  if (isVercelRuntime()) {
    throw new Error(READONLY_FALLBACK_ERROR);
  }

  try {
    await writeToFile(normalized);
  } catch (error) {
    if (error instanceof Error && error.message === READONLY_FALLBACK_ERROR) {
      throw error;
    }

    throw error;
  }
}

export function cmsStorageMode() {
  if (hasFirebaseConfig()) {
    return 'firebase';
  }

  return isVercelRuntime() ? 'readonly-fallback' : 'local-file';
}

export function isReadonlyFallbackError(error: unknown) {
  return error instanceof Error && error.message === READONLY_FALLBACK_ERROR;
}

export function isInvalidFirebaseSaveError(error: unknown) {
  return error instanceof Error && error.message === INVALID_FIREBASE_SAVE_ERROR;
}

export function isFirebaseAuthSaveError(error: unknown) {
  return error instanceof Error && error.message === FIREBASE_AUTH_SAVE_ERROR;
}