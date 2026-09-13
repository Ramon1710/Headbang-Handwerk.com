import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  canAccessHeadbangAdmin,
  canAccessZollhausAdmin,
  normalizeInternalRedirectPath,
  verifyAdminSessionToken,
} from '@/lib/cms/auth-core';

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.CMS_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'local-dev-secret';
}

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$/i.test(pathname)
  );
}

function isLegacyLoginPath(pathname: string) {
  return pathname === '/admin/login';
}

function isLoginPath(pathname: string) {
  return pathname === '/admin-login';
}

function isZollhausLoginPath(pathname: string) {
  return pathname === '/zollhaus/admin/login';
}

function isProtectedAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isProtectedZollhausAdminPath(pathname: string) {
  return (pathname === '/zollhaus/admin' || pathname.startsWith('/zollhaus/admin/')) && !isZollhausLoginPath(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const decodedPathname = decodePathname(pathname);

  if (pathname === '/huehnerjagt') {
    return NextResponse.redirect(new URL(`/hühnerjagt${search}`, request.url));
  }

  if (decodedPathname === '/hühnerjagt') {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/huehnerjagt';
    return NextResponse.rewrite(rewriteUrl);
  }

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  if (isLegacyLoginPath(pathname)) {
    return NextResponse.redirect(new URL(`/admin-login${search}`, request.url));
  }

  if (isLoginPath(pathname) || isZollhausLoginPath(pathname) || (!isProtectedAdminPath(pathname) && !isProtectedZollhausAdminPath(pathname))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifyAdminSessionToken(token, getSecret()) : null;

  if (isProtectedAdminPath(pathname)) {
    if (canAccessHeadbangAdmin(session)) {
      return NextResponse.next();
    }

    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('next', normalizeInternalRedirectPath(`${pathname}${search}`, '/admin'));

    if (session) {
      loginUrl.searchParams.set('denied', '1');
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedZollhausAdminPath(pathname) && canAccessZollhausAdmin(session)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/zollhaus/admin/login', request.url);
  loginUrl.searchParams.set('next', normalizeInternalRedirectPath(`${pathname}${search}`, '/zollhaus/admin'));

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: '/:path*',
};