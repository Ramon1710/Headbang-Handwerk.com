import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'hh_admin_session';

function getSecret() {
  return process.env.CMS_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'local-dev-secret';
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }

  return bytes;
}

async function getSigningKey() {
  const encoder = new TextEncoder();

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function verifyToken(token: string) {
  const parts = token.split(':');

  if (parts.length < 3) {
    return false;
  }

  const signature = parts.pop();
  const payload = parts.join(':');

  if (!signature || signature.length % 2 !== 0) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await getSigningKey();

  return crypto.subtle.verify('HMAC', key, hexToBytes(signature), encoder.encode(payload));
}

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$/i.test(pathname)
  );
}

function isLoginPath(pathname: string) {
  return pathname === '/admin/login';
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = Boolean(token && (await verifyToken(token)));

  if (authenticated && isLoginPath(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (authenticated || isLoginPath(pathname)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}` || '/');

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: '/:path*',
};