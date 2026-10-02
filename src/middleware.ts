import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'abhishek-hostel-secure-jwt-secret-key-2026-production';
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

// Pure Edge Web-Crypto token verification (Zero external dependencies & 100% Edge compliant)
async function verifySessionToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const key = await crypto.subtle.importKey(
      'raw',
      encodedSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Base64URL decode signature
    const base64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binarySig = Uint8Array.from(atob(paddedBase64), (c) => c.charCodeAt(0));

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, data);
    if (!isValid) return null;

    // Base64URL decode payload
    const pBase64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const pPadded = pBase64.length % 4 ? pBase64 + '='.repeat(4 - (pBase64.length % 4)) : pBase64;
    const payload = JSON.parse(atob(pPadded));

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload as { id: string; role: string; email: string; name: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js requests bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('abh_token')?.value;
  const session = token ? await verifySessionToken(token) : null;

  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-phone'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const adminOnlyRoutes = [
    '/admin',
    '/rooms',
    '/students',
    '/fees',
    '/receipts',
    '/expenses',
    '/visitors',
    '/reports',
    '/settings',
    '/notices',
  ];
  const isAdminRoute = adminOnlyRoutes.some((route) => pathname.startsWith(route));
  const isStudentRoute = pathname === '/student' || pathname.startsWith('/student/');

  // 1. Root route: redirect based on session
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.role === 'ADMIN' || session.role === 'WARDEN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/student', request.url));
  }

  // 2. If already logged in, redirect away from login/signup
  if (isAuthRoute && session) {
    const target = session.role === 'ADMIN' || session.role === 'WARDEN' ? '/admin' : '/student';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Protect Admin Routes
  if (isAdminRoute) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // 4. Protect Student Routes
  if (isStudentRoute) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role === 'ADMIN' || session.role === 'WARDEN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

