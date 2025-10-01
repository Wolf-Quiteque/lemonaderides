import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase } = await requireRole(req, ['driver','admin']);
    const { origin_lon, origin_lat, dest_lon, dest_lat, departure } = await req.json();
    const origin = `SRID=4326;POINT(${origin_lon} ${origin_lat})`;
    const dest = `SRID=4326;POINT(${dest_lon} ${dest_lat})`;

    const { data, error } = await supabase.rpc('suggest_pool_candidates', {
      p_origin: origin,
      p_destination: dest,
      p_departure: departure,
      p_radius_m: 800,
      p_time_window_min: 30
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ suggestions: data });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
