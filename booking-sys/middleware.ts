import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client that can read the auth cookies in middleware
  const supabase = createMiddlewareClient({ req, res });

  // Get user + JWT claims
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase.auth.getSession();
  const claims = session?.session?.user?.app_metadata || {}; // where roles often live

  const isAdmin = claims.role === 'admin' || claims.role === 'teacher';
  const isStudent = claims.role === 'student';

  const pathname = req.nextUrl.pathname;

  // ============
  // PROTECTED ROUTES
  // ============

  // 1. Require login for any route inside /dashboard or /rooms
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/rooms')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 2. Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!user || !isAdmin) {
      return NextResponse.redirect(new URL('/forbidden', req.url));
    }
  }

  // 3. Students cannot access teacher/admin panel
  if (pathname.startsWith('/teacher') && !isAdmin) {
    return NextResponse.redirect(new URL('/not-authorized', req.url));
  }

  return res;
}

// Tell Next.js where middleware should run
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/admin/:path*',
    '/teacher/:path*',
  ],
};
