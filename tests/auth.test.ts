import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminSession,
  buildAdminSessionCookieOptions,
  buildExpiredAdminSessionCookieOptions,
  canAccessHeadbangAdmin,
  canAccessZollhausAdmin,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/cms/auth-core';
import { createPasswordHash, verifyPasswordHash } from '@/lib/cms/auth-password';
import {
  clearLoginFailures,
  createLoginAttemptKey,
  getLoginThrottleState,
  recordFailedLogin,
  type LoginAttemptRecord,
  type LoginAttemptStore,
} from '@/lib/cms/auth-rate-limit';

function createMemoryStore(): LoginAttemptStore {
  const records = new Map<string, LoginAttemptRecord>();

  return {
    async get(key) {
      return records.get(key) || null;
    },
    async set(record) {
      records.set(record.key, record);
    },
    async delete(key) {
      records.delete(key);
    },
  };
}

test('gueltiger Passwort-Hash wird akzeptiert', async () => {
  const hash = await createPasswordHash('Testpasswort-123!');

  assert.equal(await verifyPasswordHash('Testpasswort-123!', hash), true);
  assert.equal(await verifyPasswordHash('falsch', hash), false);
});

test('ungueltiges Hash-Format wird abgewiesen', async () => {
  assert.equal(await verifyPasswordHash('Testpasswort-123!', 'ungueltig'), false);
});

test('manipulierte Session wird verworfen', async () => {
  const session = buildAdminSession({ username: 'headbang', role: 'headbang-admin', now: 1000 });
  const token = await createAdminSessionToken(session, 'secret');
  const tampered = `${token.slice(0, -1)}x`;

  assert.equal(await verifyAdminSessionToken(tampered, 'secret'), null);
});

test('abgelaufene Session wird verworfen', async () => {
  const session = buildAdminSession({ username: 'headbang', role: 'headbang-admin', now: Date.now() - 13 * 60 * 60 * 1000, maxAgeSeconds: 60 });
  const token = await createAdminSessionToken(session, 'secret');

  assert.equal(await verifyAdminSessionToken(token, 'secret'), null);
});

test('unbekannte Rolle wird verworfen', async () => {
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      sessionId: '1234567890abcdef',
      username: 'headbang',
      role: 'unknown',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 10_000,
    }),
    'utf8'
  ).toString('base64url');

  assert.equal(await verifyAdminSessionToken(`${payload}.invalid`, 'secret'), null);
});

test('Zugriffsmatrix beider Rollen ist korrekt', () => {
  const headbangSession = buildAdminSession({ username: 'hh', role: 'headbang-admin' });
  const zollhausSession = buildAdminSession({ username: 'zh', role: 'zollhaus-admin' });

  assert.equal(canAccessHeadbangAdmin(headbangSession), true);
  assert.equal(canAccessZollhausAdmin(headbangSession), true);
  assert.equal(canAccessHeadbangAdmin(zollhausSession), false);
  assert.equal(canAccessZollhausAdmin(zollhausSession), true);
});

test('Login-Limit sperrt nach wiederholten Fehlversuchen und laesst Reset zu', async () => {
  const store = createMemoryStore();
  const key = createLoginAttemptKey('zollhaus-admin', 'zh-admin', '203.0.113.42', 'secret');
  const now = 1_000;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await recordFailedLogin(store, key, now + attempt);
  }

  const blocked = await getLoginThrottleState(store, key, now + 5);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  await clearLoginFailures(store, key);
  const afterReset = await getLoginThrottleState(store, key, now + 6);
  assert.equal(afterReset.allowed, true);
});

test('Logout-Cookie loescht die Session', () => {
  const active = buildAdminSessionCookieOptions(true);
  const expired = buildExpiredAdminSessionCookieOptions(true);

  assert.equal(active.httpOnly, true);
  assert.equal(active.sameSite, 'lax');
  assert.equal(expired.maxAge, 0);
  assert.ok(expired.expires instanceof Date);
});