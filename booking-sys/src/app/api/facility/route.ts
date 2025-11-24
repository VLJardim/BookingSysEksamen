import { NextResponse } from 'next/server';
import adminSupabase from '../../../lib/serverSupabase';

export async function GET() {
  const { data, error } = await adminSupabase.from('facilities').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
