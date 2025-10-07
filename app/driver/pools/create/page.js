'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase.js';
import { getAuthHeader } from '@/lib/authHeader';
import { loadYandex } from '@/lib/yandex';

export default function CreatePool() {
  const [seats, setSeats] = useState(3);
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0,16)); // local datetime-local
  const [msg, setMsg] = useState('');
  const [ymapsReady, setYmapsReady] = useState(false);
  const mapRef = useRef(null);
  const ymapsRef = useRef(null);
  const routeRef = useRef(null);
  const [a, setA] = useState([13.235, -8.838]); // [lon,lat]
  const [b, setB] = useState([13.300, -8.900]);

  useEffect(() => {
    loadYandex({ apiKey: process.env.NEXT_PUBLIC_YANDEX_API_KEY }).then((ymaps) => {
      ymapsRef.current = ymaps;
      // build map
      mapRef.current = new ymaps.Map('pool-map', { center: a, zoom: 12 }, { suppressMapOpenBlock: true });
      setYmapsReady(true);
    }).catch(console.error);
  }, []);

  async function buildRoute() {
    setMsg('');
    const ymaps = ymapsRef.current;
    if (!ymaps || !mapRef.current) return;

    // Clear previous route
    if (routeRef.current) {
      mapRef.current.geoObjects.remove(routeRef.current);
      routeRef.current = null;
    }

    const multiRoute = new ymaps.multiRouter.MultiRoute({
      referencePoints: [a, b],
      params: { routingMode: 'auto' }
    }, {
      boundsAutoApply: true
    });

    routeRef.current = multiRoute;
    mapRef.current.geoObjects.add(multiRoute);
  }

  function polylineFromRoute() {
    const ymaps = ymapsRef.current;
    if (!ymaps || !routeRef.current) return null;
    try {
      const active = routeRef.current.getActiveRoute();
      if (!active) return null;
      const paths = active.getPaths();
      const coords = [];
      paths.each(function (path) {
        path.getSegments().each(function (seg) {
          const pts = seg.getCoordinates(); // array of [lon, lat]
          for (const p of pts) coords.push(p);
        });
      });
      return coords; // [[lon,lat], ...]
    } catch (e) {
      return null;
    }
  }

  async function createPool() {
    setMsg('');
    try {
      const coords = polylineFromRoute();
      if (!coords || !coords.length) {
        setMsg('Please click "Build Route" first to generate polyline.');
        return;
      }
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
      const body = {
        scheduled_for: new Date(when).toISOString(),
        available_seats: Number(seats),
        origin_lon: a[0], origin_lat: a[1],
        dest_lon: b[0], dest_lat: b[1],
        route_polyline: JSON.stringify(coords)
      };
      const res = await fetch('/api/driver/pool/create', { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create pool');
      setMsg('Pool created.');
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Create Pool</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm">Available seats</label>
          <input type="number" min="1" className="border rounded p-2 w-full" value={seats} onChange={e=>setSeats(e.target.value)} />

          <label className="block text-sm mt-2">When</label>
          <input type="datetime-local" className="border rounded p-2 w-full"
            value={when} onChange={e=>setWhen(e.target.value)} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Origin lon,lat</label>
              <input className="border rounded p-2 w-full text-xs" value={a.join(',')}
                onChange={e=>setA(e.target.value.split(',').map(Number))} />
            </div>
            <div>
              <label className="block text-sm">Destination lon,lat</label>
              <input className="border rounded p-2 w-full text-xs" value={b.join(',')}
                onChange={e=>setB(e.target.value.split(',').map(Number))} />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={buildRoute} className="px-3 py-1 rounded bg-gray-900 text-white">Build Route</button>
            <button onClick={createPool} className="px-3 py-1 rounded bg-green-600 text-white">Create Pool</button>
          </div>

          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>

        <div>
          <div id="pool-map" style={{ width: '100%', height: 420, borderRadius: 12 }} />
          {!ymapsReady && <p className="text-sm mt-2">Loading map…</p>}
        </div>
      </div>
    </div>
  );
}
