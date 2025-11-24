import { NextResponse } from 'next/server';
import adminSupabase from '../../../lib/serverSupabase';
import { bookingCreateSchema } from '../../../lib/schemas/dbSchemas';

// GET: list bookings
export async function GET() {
  const { data, error } = await adminSupabase.from('bookings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create booking
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bookingCreateSchema.parse(body);

    // TODO: validate user/session. Currently this uses the service role client.
    const { data, error } = await adminSupabase.from('bookings').insert(parsed).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
