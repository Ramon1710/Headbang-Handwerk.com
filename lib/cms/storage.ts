import { cache } from 'react';
import { defaultCmsContent } from './default-content';
import type { CmsContent } from './schema';

const READONLY_FALLBACK_ERROR = 'CMS_READONLY_FALLBACK';

type DatabasePool = Awaited<ReturnType<typeof createPool>>;

let pool: DatabasePool | null = null;

function getDatabaseUrl() {
  return process.env.CMS_DATABASE_URL || process.env.DATABASE_URL;
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

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

async function createPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('Keine CMS-Datenbank konfiguriert.');
  }

  const mysql = await import('mysql2/promise');

  return mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 4,
    ssl: process.env.CMS_DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  });
}

async function getPool() {
  if (!pool) {
    pool = await createPool();
  }

  return pool;
}

async function ensureDatabaseTable() {
  const db = await getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_content (
      id VARCHAR(32) PRIMARY KEY,
      payload JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function readFromDatabase(): Promise<CmsContent | null> {
  await ensureDatabaseTable();
  const db = await getPool();
  const [rows] = await db.execute(
    'SELECT payload FROM cms_content WHERE id = ? LIMIT 1',
    ['site']
  );

  if (!Array.isArray(rows) || !rows.length) {
    return null;
  }

  const payload = (rows[0] as { payload: string | CmsContent }).payload;
  return typeof payload === 'string' ? (JSON.parse(payload) as CmsContent) : (payload as CmsContent);
}

async function writeToDatabase(content: CmsContent) {
  await ensureDatabaseTable();
  const db = await getPool();
  await db.execute(
    `
      INSERT INTO cms_content (id, payload)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE payload = VALUES(payload)
    `,
    ['site', JSON.stringify(content)]
  );
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
      footer: { ...defaultCmsContent.site.footer, ...content.site.footer },
    },
  };
}

export const getCmsContent = cache(async (): Promise<CmsContent> => {
  if (!hasDatabase() && isVercelRuntime()) {
    return defaultCmsContent;
  }

  let content: CmsContent | null;

  try {
    content = hasDatabase() ? await readFromDatabase() : await readFromFile();
  } catch (error) {
    if (!hasDatabase() && error instanceof Error && error.message === READONLY_FALLBACK_ERROR) {
      return defaultCmsContent;
    }

    throw error;
  }

  if (!content) {
    if (hasDatabase()) {
      await writeToDatabase(defaultCmsContent);
    }

    return defaultCmsContent;
  }

  return normalizeContent(content);
});

export async function saveCmsContent(content: CmsContent) {
  const normalized = normalizeContent(content);

  if (hasDatabase()) {
    await writeToDatabase(normalized);
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
  if (hasDatabase()) {
    return 'mysql';
  }

  return isVercelRuntime() ? 'readonly-fallback' : 'local-file';
}

export function isReadonlyFallbackError(error: unknown) {
  return error instanceof Error && error.message === READONLY_FALLBACK_ERROR;
}