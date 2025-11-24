import { NextResponse } from 'next/server';
import adminSupabase from '../../../../lib/serverSupabase';

function parseCookieToken(cookieHeader?: string | null) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  // common Supabase cookie names
  const tokenCookie = cookies.find((c) => c.startsWith('sb-access-token=')) || cookies.find((c) => c.startsWith('session='));
  if (!tokenCookie) return null;
  const [, value] = tokenCookie.split('=');
  return decodeURIComponent(value);
}

export async function GET(req: Request) {
  try {
    // Try Authorization header first
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Fallback to cookie parsing
    const cookieToken = parseCookieToken(req.headers.get('cookie'));

    const token = bearer ?? cookieToken;
    if (!token) return NextResponse.json({ user: null, session: null });

    // Use the admin client to lookup the user from the token
    const { data, error } = await adminSupabase.auth.getUser(token);
    if (error) return NextResponse.json({ error: error.message }, { status: 401 });

    return NextResponse.json({ user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unable to get session' }, { status: 500 });
  }
}
