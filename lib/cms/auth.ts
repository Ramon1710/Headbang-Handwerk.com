import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'hh_admin_session';

function getSecret() {
  return process.env.CMS_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'local-dev-secret';
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function expectedCredentials() {
  return {
    username: process.env.CMS_ADMIN_USERNAME || 'admin',
    password: process.env.CMS_ADMIN_PASSWORD || 'changeme',
  };
}

function createToken(username: string) {
  const payload = `${username}:${Date.now()}`;
  return `${payload}:${sign(payload)}`;
}

function verifyToken(token: string) {
  const parts = token.split(':');

  if (parts.length < 3) {
    return false;
  }

  const signature = parts.pop();
  const payload = parts.join(':');

  return signature === sign(payload);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  return Boolean(token && verifyToken(token));
}

export async function loginAdmin(username: string, password: string) {
  const expected = expectedCredentials();

  if (username !== expected.username || password !== expected.password) {
    return false;
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return true;
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}