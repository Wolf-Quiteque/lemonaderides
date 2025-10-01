import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase } = await requireRole(req, ['supervisor','admin']);
    const { ride_id, status, notes } = await req.json(); // 'approved' | 'rejected'

    const { error } = await supabase.from('approvals').insert([{ ride_id, status, notes }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
