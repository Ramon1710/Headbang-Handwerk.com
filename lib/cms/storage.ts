import { promises as fs } from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { cache } from 'react';
import { defaultCmsContent } from './default-content';
import type { CmsContent } from './schema';

const LOCAL_DATA_DIR = path.join(process.cwd(), '.cms');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'content.json');
const READONLY_FALLBACK_ERROR = 'CMS_READONLY_FALLBACK';

let pool: mysql.Pool | null = null;

function getDatabaseUrl() {
  return process.env.CMS_DATABASE_URL || process.env.DATABASE_URL;
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function isReadonlyFilesystemError(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const code = String(error.code);
  return code === 'EROFS' || code === 'EACCES' || code === 'EPERM';
}

function getPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('Keine CMS-Datenbank konfiguriert.');
  }

  if (!pool) {
    pool = mysql.createPool({
      uri: databaseUrl,
      connectionLimit: 4,
      ssl: process.env.CMS_DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureDatabaseTable() {
  const db = getPool();

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
  const db = getPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT payload FROM cms_content WHERE id = ? LIMIT 1',
    ['site']
  );

  if (!rows.length) {
    return null;
  }

  const payload = rows[0].payload;
  return typeof payload === 'string' ? (JSON.parse(payload) as CmsContent) : (payload as CmsContent);
}

async function writeToDatabase(content: CmsContent) {
  await ensureDatabaseTable();
  const db = getPool();
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
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });

    try {
      await fs.access(LOCAL_DATA_FILE);
    } catch {
      await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(defaultCmsContent, null, 2), 'utf8');
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
  const raw = await fs.readFile(LOCAL_DATA_FILE, 'utf8');
  return JSON.parse(raw) as CmsContent;
}

async function writeToFile(content: CmsContent) {
  await ensureLocalFile();
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(content, null, 2), 'utf8');
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

  return process.env.VERCEL ? 'readonly-fallback' : 'local-file';
}

export function isReadonlyFallbackError(error: unknown) {
  return error instanceof Error && error.message === READONLY_FALLBACK_ERROR;
}