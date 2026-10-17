import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE_EXTENSIONS = /\.(.*)$/;
const IGNORED_PATHS = ['/_next', '/api', '/icon.svg', '/logo.svg', '/signature.png', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip Next.js internals, API routes and static public files
  if (
    IGNORED_PATHS.some((path) => pathname.startsWith(path)) ||
    PUBLIC_FILE_EXTENSIONS.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // 2. Turkish Subpath (/tr or /tr/...)
  if (pathname === '/tr' || pathname.startsWith('/tr/')) {
    const internalPath = pathname === '/tr' ? '/' : pathname.replace(/^\/tr/, '') || '/';
    const rewriteUrl = new URL(`${internalPath}${search}`, request.url);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', 'tr');

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('x-locale', 'tr');

    // Ensure cookie is synced with the active subpath if not already set
    if (cookieLocale !== 'tr') {
      response.cookies.set('NEXT_LOCALE', 'tr', {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    }

    return response;
  }

  // 3. Root & Default English Path (/)
  // If the user has an explicit cookie set to 'tr' and hits root, route them to /tr
  if (pathname === '/' && cookieLocale === 'tr') {
    return NextResponse.redirect(new URL(`/tr${search}`, request.url));
  }

  // If no explicit cookie is set, detect regional origin on first visit to root
  if (pathname === '/' && !cookieLocale) {
    const country = request.headers.get('x-vercel-ip-country') || '';
    const acceptLang = request.headers.get('accept-language') || '';

    const isFromTurkey = country.toUpperCase() === 'TR';
    const prefersTurkish = acceptLang.toLowerCase().includes('tr');

    if (isFromTurkey || prefersTurkish) {
      return NextResponse.redirect(new URL(`/tr${search}`, request.url));
    }
  }

  // Default English route
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', 'en');
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('x-locale', 'en');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
