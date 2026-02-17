import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/financials',
    '/categories',
    '/templates',
    '/trash',
    '/backup',
    '/devices/new',
];

// Routes that require auth if they match a pattern
const PROTECTED_PATTERNS = [
    /^\/devices\/\d+\/edit$/,
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isProtectedPattern = PROTECTED_PATTERNS.some(pattern => pattern.test(pathname));

    if (!isProtectedRoute && !isProtectedPattern) {
        return NextResponse.next();
    }

    // Check for access token in cookies or localStorage
    // Note: We can't access localStorage in middleware, so we check the cookie
    // The auth context will handle the actual validation client-side
    const accessToken = request.cookies.get('inv_access_token')?.value;

    // For protected routes without a token cookie, redirect to login
    // The auth context on the client will do the real validation
    // This is mainly to prevent flash of protected content
    if (!accessToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - uploads (static uploads)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|login|uploads|logo.png).*)',
    ],
};
