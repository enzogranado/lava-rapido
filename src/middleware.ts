import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, parseSessionToken } from '@/lib/session';

// Redirected away from if already authenticated (login/register screens don't make sense mid-session)
const PUBLIC_PAGES = ['/login', '/cadastro', '/landing'];
// Public regardless of auth state — a logged-in staff member previewing the customer link
// must still see the tracking page, not get bounced to the dashboard
const PUBLIC_PAGES_ALWAYS = ['/acompanhar'];
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
];
// Prefix-matched public API routes (dynamic segments, e.g. the customer-facing tracking link)
const PUBLIC_API_PREFIXES = ['/api/public/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next.js internals, static assets, and media files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  const session = cookie?.value ? parseSessionToken(cookie.value) : null;
  const isAuthenticated = !!session;

  const isPublicPage = PUBLIC_PAGES.some((page) => pathname === page || pathname.startsWith(page + '/'));
  const isPublicPageAlways = PUBLIC_PAGES_ALWAYS.some((page) => pathname === page || pathname.startsWith(page + '/'));
  const isPublicApi =
    PUBLIC_API_ROUTES.some((route) => pathname === route) ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // API Routes Security
  if (pathname.startsWith('/api/')) {
    if (isPublicApi) {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Sessão expirada ou não autenticada. Faça login.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Always-public pages (e.g. customer tracking link) — never redirected, regardless of auth state
  if (isPublicPageAlways) {
    return NextResponse.next();
  }

  // Public Page Routes (Login / Register)
  if (isPublicPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protected Page Routes (Dashboard, Atendimentos, Clientes, etc.)
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Admin Route Restriction
  if (pathname.startsWith('/admin') && session?.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
