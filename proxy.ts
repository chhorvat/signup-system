import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  const { pathname } = req.nextUrl;

  // Allow login page and login API through
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Protect /admin/* pages and /api/admin/* routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Pass token to the request via a header so server components can validate it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-admin-session', token);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
