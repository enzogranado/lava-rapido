import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, parseSessionToken } from '@/lib/session';

const PUBLIC_PAGES = ['/login', '/cadastro'];
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
];

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
  const isPublicApi = PUBLIC_API_ROUTES.some((route) => pathname === route);

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
