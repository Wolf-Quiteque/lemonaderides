import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase } = await requireRole(req, ['driver','admin']);
    const { pool_id, ride_id, user_id } = await req.json();

    const { error } = await supabase.from('pool_participants').insert([{ pool_id, ride_id, user_id }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
