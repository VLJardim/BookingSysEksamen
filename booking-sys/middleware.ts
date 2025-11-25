import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Try to dynamically load the Supabase auth-helpers so middleware still works
  // even if the package isn't installed yet (fallback will be used).
  let supabase: any = null;
  try {
    const mod = await import('@supabase/auth-helpers-nextjs');
    const { createMiddlewareClient } = mod as any;
    supabase = createMiddlewareClient({ req, res });
  } catch (e) {
    // auth-helpers not available or failed to initialize in this environment.
    supabase = null;
  }

  // Try to read user/session from the supabase helper when available
  let user: any = null;
  let session: any = null;
  if (supabase) {
    try {
      const userResult = await supabase.auth.getUser();
      user = userResult?.data?.user ?? null;

      const sessionResult = await supabase.auth.getSession();
      session = sessionResult?.data?.session ?? null;
    } catch (e) {
      user = null;
      session = null;
    }
  } else {
    // Fallback: check for common Supabase cookie tokens. This only checks presence,
    // it does not validate the token — validation should occur in server routes.
    const token = req.cookies.get('sb-access-token')?.value ?? req.cookies.get('session')?.value;
    if (token) user = { tokenPresent: true };
  }

  // Extract role from common locations with fallbacks
  const claims =
    session?.user?.app_metadata ?? session?.user?.user_metadata ?? session?.user ?? {};
  const role = claims?.role ?? null;
  const isAdmin = role === 'admin' || role === 'teacher';

  const pathname = req.nextUrl.pathname;

  // Protected routes for this app — adjust as needed
  const protectedPaths = ['/profile', '/my-bookings'];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only example
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/forbidden', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/profile/:path*', '/my-bookings/:path*', '/admin/:path*'],
};
