import { cache } from 'react';
import { defaultCmsContent } from './default-content';
import {
  getFirebaseDb,
  hasFirebaseConfig,
  isFirebaseAuthError,
  isInvalidFirebaseConfigError,
  toFirebaseAuthError,
} from './firebase';
import { emptyLiveEditorContent } from './live-editor';
import type { CmsContent } from './schema';

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

function normalizeContent(content: CmsContent): CmsContent {
  return {
    theme: { ...defaultCmsContent.theme, ...content.theme },
    site: {
      ...defaultCmsContent.site,
      ...content.site,
      seo: { ...defaultCmsContent.site.seo, ...content.site.seo },
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