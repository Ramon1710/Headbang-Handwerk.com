import { randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
  buildAdminSession,
  buildAdminSessionCookieOptions,
  buildExpiredAdminSessionCookieOptions,
  canAccessHeadbangAdmin,
  canAccessZollhausAdmin,
  createAdminSessionToken,
  normalizeInternalRedirectPath,
  type AdminRole,
  type AdminSession,
  verifyAdminSessionToken,
} from './auth-core';
import { assertZollhausLoginAllowed, clearLoginFailures, recordFailedLogin } from './auth-rate-limit';
import { verifyPasswordHash } from './auth-password';

let warnedLegacyCredentials = false;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.CMS_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'local-dev-secret';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const targetLength = Math.max(leftBuffer.length, rightBuffer.length, 1);
  const paddedLeft = Buffer.alloc(targetLength);
  const paddedRight = Buffer.alloc(targetLength);

  leftBuffer.copy(paddedLeft);
  rightBuffer.copy(paddedRight);

  return timingSafeEqual(paddedLeft, paddedRight) && leftBuffer.length === rightBuffer.length;
}

function warnLegacyHeadbangCredentials() {
  if (warnedLegacyCredentials) {
    return;
  }

  warnedLegacyCredentials = true;
  console.warn('Legacy Headbang-Admin-Credentials aktiv. Bitte auf HEADBANG_ADMIN_USERNAME und HEADBANG_ADMIN_PASSWORD_HASH umstellen und CMS_ADMIN_PASSWORD anschliessend entfernen.');
}

function getCookieOptions() {
  return buildAdminSessionCookieOptions(process.env.NODE_ENV === 'production');
}

function getExpectedHeadbangUsername() {
  return String(process.env.HEADBANG_ADMIN_USERNAME || process.env.CMS_ADMIN_USERNAME || '').trim();
}

function getExpectedZollhausUsername() {
  return String(process.env.ZOLLHAUS_ADMIN_USERNAME || '').trim();
}

function hasLegacyHeadbangPasswordFallback() {
  return Boolean(process.env.CMS_ADMIN_PASSWORD);
}

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get('x-forwarded-for') || '';
  const candidate = forwardedFor.split(',')[0]?.trim();

  if (candidate) {
    return candidate;
  }

  return headerStore.get('x-real-ip') || '';
}

function getAllowedHosts(headerStore: Headers) {
  return [headerStore.get('x-forwarded-host'), headerStore.get('host')]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isTrustedSource(value: string | null, hosts: string[]) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return hosts.includes(url.host.toLowerCase());
  } catch {
    return false;
  }
}

async function setSessionCookie(username: string, role: AdminRole) {
  const session = buildAdminSession({
    username,
    role,
    now: Date.now(),
  });
  session.sessionId = randomUUID();

  const token = await createAdminSessionToken(session, getSessionSecret());
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, getCookieOptions());

  return session;
}

async function verifyHeadbangCredentials(username: string, password: string) {
  const expectedUsername = getExpectedHeadbangUsername();
  const passwordHash = String(process.env.HEADBANG_ADMIN_PASSWORD_HASH || '').trim();

  if (!expectedUsername) {
    return false;
  }

  if (!safeEqual(username, expectedUsername)) {
    if (passwordHash) {
      await verifyPasswordHash(password, passwordHash);
    }

    return false;
  }

  if (passwordHash) {
    return verifyPasswordHash(password, passwordHash);
  }

  if (!hasLegacyHeadbangPasswordFallback()) {
    return false;
  }

  warnLegacyHeadbangCredentials();
  return safeEqual(password, String(process.env.CMS_ADMIN_PASSWORD || ''));
}

async function verifyZollhausCredentials(username: string, password: string) {
  const expectedUsername = getExpectedZollhausUsername();
  const passwordHash = String(process.env.ZOLLHAUS_ADMIN_PASSWORD_HASH || '').trim();

  if (!expectedUsername || !passwordHash) {
    return { valid: false, configured: false } as const;
  }

  if (!safeEqual(username, expectedUsername)) {
    await verifyPasswordHash(password, passwordHash);
    return { valid: false, configured: true } as const;
  }

  return {
    valid: await verifyPasswordHash(password, passwordHash),
    configured: true,
  } as const;
}

export async function requireTrustedOrigin() {
  const headerStore = await headers();
  const allowedHosts = getAllowedHosts(headerStore);
  const origin = headerStore.get('origin');
  const referer = headerStore.get('referer');

  if (!allowedHosts.length) {
    throw new Error('UNTRUSTED_ORIGIN');
  }

  if (origin) {
    if (!isTrustedSource(origin, allowedHosts)) {
      throw new Error('UNTRUSTED_ORIGIN');
    }

    return;
  }

  if (!isTrustedSource(referer, allowedHosts)) {
    throw new Error('UNTRUSTED_ORIGIN');
  }
}

export function hasTrustedRequestOrigin(request: Request) {
  const allowedHosts = [request.headers.get('x-forwarded-host'), request.headers.get('host')]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedHosts.length) {
    return false;
  }

  const origin = request.headers.get('origin');

  if (origin) {
    return isTrustedSource(origin, allowedHosts);
  }

  return isTrustedSource(request.headers.get('referer'), allowedHosts);
}

export async function getAuthenticatedAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token, getSessionSecret());
}

export async function getAuthenticatedAdminSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token, getSessionSecret());
}

export async function isAdminAuthenticated() {
  return canAccessHeadbangAdmin(await getAuthenticatedAdminSession());
}

export async function hasZollhausAccess() {
  return canAccessZollhausAdmin(await getAuthenticatedAdminSession());
}

export async function requireHeadbangAdmin(nextPath = '/admin') {
  const session = await getAuthenticatedAdminSession();

  if (canAccessHeadbangAdmin(session)) {
    return session as AdminSession;
  }

  const loginTarget = normalizeInternalRedirectPath(nextPath, '/admin');
  const params = new URLSearchParams({ next: loginTarget });

  if (session) {
    params.set('denied', '1');
  }

  redirect(`/admin-login?${params.toString()}`);
}

export async function requireZollhausAccess(nextPath = '/zollhaus/admin') {
  const session = await getAuthenticatedAdminSession();

  if (canAccessZollhausAdmin(session)) {
    return session as AdminSession;
  }

  const loginTarget = normalizeInternalRedirectPath(nextPath, '/zollhaus/admin');
  const params = new URLSearchParams({ next: loginTarget });
  redirect(`/zollhaus/admin/login?${params.toString()}`);
}

export async function requireHeadbangAdminAction(nextPath = '/admin') {
  await requireTrustedOrigin();
  return requireHeadbangAdmin(nextPath);
}

export async function requireZollhausAccessAction(nextPath = '/zollhaus/admin') {
  await requireTrustedOrigin();
  return requireZollhausAccess(nextPath);
}

export async function loginHeadbangAdmin(username: string, password: string) {
  const valid = await verifyHeadbangCredentials(username.trim(), password);

  if (!valid) {
    return { ok: false as const, reason: 'invalid-credentials' as const };
  }

  const session = await setSessionCookie(username.trim(), 'headbang-admin');
  return { ok: true as const, session };
}

export async function loginZollhausAdmin(username: string, password: string) {
  const normalizedUsername = username.trim();
  const headerStore = await headers();
  const secret = getSessionSecret();
  const rateLimit = await assertZollhausLoginAllowed(normalizedUsername, getClientIpFromHeaders(headerStore), secret);

  if (!rateLimit.allowed) {
    return {
      ok: false as const,
      reason: 'rate-limited' as const,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const verification = await verifyZollhausCredentials(normalizedUsername, password);

  if (!verification.configured) {
    return { ok: false as const, reason: 'not-configured' as const };
  }

  if (!verification.valid) {
    await recordFailedLogin(rateLimit.store, rateLimit.key);
    return { ok: false as const, reason: 'invalid-credentials' as const };
  }

  await clearLoginFailures(rateLimit.store, rateLimit.key);
  const session = await setSessionCookie(normalizedUsername, 'zollhaus-admin');
  return { ok: true as const, session };
}

export async function logoutAdmin() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, '', buildExpiredAdminSessionCookieOptions(process.env.NODE_ENV === 'production'));
}