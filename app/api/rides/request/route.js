import { NextResponse } from 'next/server';
import { supabaseFromRequest } from '@/lib/supabaseServer';

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = supabaseFromRequest(req);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const originCoords = (body.origin_lon != null && body.origin_lat != null)
      ? `SRID=4326;POINT(${body.origin_lon} ${body.origin_lat})` : null;
    const destCoords = (body.dest_lon != null && body.dest_lat != null)
      ? `SRID=4326;POINT(${body.dest_lon} ${body.dest_lat})` : null;

    const insert = {
      requester_id: user.id,
      origin: body.origin,
      origin_coords: originCoords,
      destination: body.destination,
      destination_coords: destCoords,
      seats_requested: body.seats_requested ?? 1,
      notes: body.notes ?? null,
      scheduled_for: body.scheduled_for ?? null,
    };

    const { data, error } = await supabase.from('rides').insert([insert]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ride: data });
  } catch (e) {
    const msg = e?.message || 'server_error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
