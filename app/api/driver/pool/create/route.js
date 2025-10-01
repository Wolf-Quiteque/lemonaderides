import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const { supabase, user } = await requireRole(req, ['driver','admin']);
    const body = await req.json();

    const origin = body.origin_lon != null && body.origin_lat != null
      ? `SRID=4326;POINT(${body.origin_lon} ${body.origin_lat})` : null;
    const dest = body.dest_lon != null && body.dest_lat != null
      ? `SRID=4326;POINT(${body.dest_lon} ${body.dest_lat})` : null;

    const insert = {
      driver_id: user.id,
      scheduled_for: body.scheduled_for,
      available_seats: body.available_seats,
      route_polyline: body.route_polyline || null,
      origin_coords: origin,
      destination_coords: dest,
      status: 'active'
    };

    const { data, error } = await supabase.from('ride_pools').insert([insert]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ pool: data });
  } catch (e) {
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: code });
  }
}
