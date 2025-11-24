import { NextResponse } from 'next/server';
import adminSupabase from '../../../../lib/serverSupabase';
import { bookingUpdateSchema } from '../../../../lib/schemas/dbSchemas';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { data, error } = await adminSupabase.from('bookings').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const parsed = bookingUpdateSchema.parse(body);

    // TODO: validate user's permission to update this booking
    const { data, error } = await adminSupabase.from('bookings').update(parsed).eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  // TODO: validate user's permission to delete
  const { data, error } = await adminSupabase.from('bookings').delete().eq('id', id).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
