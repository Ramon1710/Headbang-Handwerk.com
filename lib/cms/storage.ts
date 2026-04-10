import { cache } from 'react';
import { defaultCmsContent } from './default-content';
import { getFirebaseDb, hasFirebaseConfig } from './firebase';
import type { CmsContent } from './schema';

const READONLY_FALLBACK_ERROR = 'CMS_READONLY_FALLBACK';

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

async function readFromFirebase(): Promise<CmsContent | null> {
  const db = getFirebaseDb();
  const snapshot = await db.collection('cms').doc('site').get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as CmsContent;
}

async function writeToFirebase(content: CmsContent) {
  const db = getFirebaseDb();
  await db.collection('cms').doc('site').set(content, { merge: true });
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

function normalizeContent(content: CmsContent): CmsContent {
  return {
    theme: { ...defaultCmsContent.theme, ...content.theme },
    site: {
      ...defaultCmsContent.site,
      ...content.site,
      seo: { ...defaultCmsContent.site.seo, ...content.site.seo },
      home: { ...defaultCmsContent.site.home, ...content.site.home },
      sponsors: { ...defaultCmsContent.site.sponsors, ...content.site.sponsors },
      about: { ...defaultCmsContent.site.about, ...content.site.about },
      contact: { ...defaultCmsContent.site.contact, ...content.site.contact },
      stand: { ...defaultCmsContent.site.stand, ...content.site.stand },
      footer: { ...defaultCmsContent.site.footer, ...content.site.footer },
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
    await writeToFirebase(normalized);
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