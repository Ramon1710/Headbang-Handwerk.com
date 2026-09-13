export const ADMIN_SESSION_COOKIE = 'hh_admin_session';
export const ADMIN_SESSION_VERSION = 1;
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AdminRole = 'headbang-admin' | 'zollhaus-admin';

export interface AdminSession {
  version: number;
  sessionId: string;
  username: string;
  role: AdminRole;
  issuedAt: number;
  expiresAt: number;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isKnownAdminRole(value: unknown): value is AdminRole {
  return value === 'headbang-admin' || value === 'zollhaus-admin';
}

function parsePositiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function isValidSession(candidate: unknown): candidate is AdminSession {
  if (!isRecord(candidate)) {
    return false;
  }

  const issuedAt = parsePositiveInteger(candidate.issuedAt);
  const expiresAt = parsePositiveInteger(candidate.expiresAt);

  return (
    candidate.version === ADMIN_SESSION_VERSION &&
    typeof candidate.sessionId === 'string' &&
    candidate.sessionId.length >= 16 &&
    typeof candidate.username === 'string' &&
    candidate.username.trim().length > 0 &&
    isKnownAdminRole(candidate.role) &&
    issuedAt !== null &&
    expiresAt !== null &&
    expiresAt > issuedAt
  );
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payload: string, secret: string) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));

  return bytesToBase64Url(new Uint8Array(signature));
}

export function normalizeInternalRedirectPath(value: string | null | undefined, fallback: string) {
  const normalized = String(value || '').trim();

  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return fallback;
  }

  return normalized;
}

export function buildAdminSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function buildExpiredAdminSessionCookieOptions(secure: boolean) {
  return {
    ...buildAdminSessionCookieOptions(secure),
    expires: new Date(0),
    maxAge: 0,
  };
}

export function buildAdminSession(params: { username: string; role: AdminRole; now?: number; maxAgeSeconds?: number }): AdminSession {
  const now = params.now ?? Date.now();
  const maxAgeSeconds = params.maxAgeSeconds ?? ADMIN_SESSION_MAX_AGE_SECONDS;

  return {
    version: ADMIN_SESSION_VERSION,
    sessionId: crypto.randomUUID(),
    username: params.username,
    role: params.role,
    issuedAt: now,
    expiresAt: now + maxAgeSeconds * 1000,
  };
}

export async function createAdminSessionToken(session: AdminSession, secret: string) {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token: string, secret: string) {
  const [payload, signature] = token.split('.');

  if (!payload || !signature || token.split('.').length !== 2) {
    return null;
  }

  const key = await importSigningKey(secret);
  const verified = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(payload)
  );

  if (!verified) {
    return null;
  }

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));

    if (!isValidSession(parsed)) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function canAccessHeadbangAdmin(session: AdminSession | null) {
  return session?.role === 'headbang-admin';
}

export function canAccessZollhausAdmin(session: AdminSession | null) {
  return session?.role === 'headbang-admin' || session?.role === 'zollhaus-admin';
}