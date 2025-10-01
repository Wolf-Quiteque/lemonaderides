import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase } = await requireRole(req, ['supervisor','admin']);
    const { ride_id, driver_id } = await req.json();
    if (!ride_id || !driver_id) {
      return NextResponse.json({ error: 'ride_id and driver_id are required' }, { status: 400 });
    }

    // Insert or upsert assignment (unique per ride), update ride status to 'assigned'
    const { error: aErr } = await supabase
      .from('ride_assignments')
      .upsert({ ride_id, driver_id }, { onConflict: 'ride_id' });

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

    const { error: rErr } = await supabase
      .from('rides')
      .update({ status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', ride_id);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
