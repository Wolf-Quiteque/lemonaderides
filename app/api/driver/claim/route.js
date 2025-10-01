import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase, user } = await requireRole(req, ['driver','admin']);
    const { ride_id } = await req.json();

    const { error } = await supabase.from('ride_claims').insert([{ ride_id, driver_id: user.id }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
