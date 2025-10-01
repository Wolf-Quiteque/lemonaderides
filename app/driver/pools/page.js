'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getAuthHeader } from '../../../lib/authHeader';

export default function DriverPools() {
  const [pools, setPools] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [msg, setMsg] = useState('');

  async function loadPools() {
    const { data, error } = await supabase
      .from('ride_pools')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setPools(data || []);
  }
  useEffect(()=>{ loadPools(); }, []);

  async function fetchSuggestions(pool) {
    setSelectedPool(pool);
    setSuggestions([]);
    setMsg('');
    const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };

    // you should load pool origin/dest coords from your pool object (store them when creating the pool)
    // Here we assume pool has origin/destination coords; fallback to hard-coded lon/lat if not.
    const body = {
      origin_lon: pool?.origin_lon ?? 13.235,
      origin_lat: pool?.origin_lat ?? -8.838,
      dest_lon:   pool?.dest_lon   ?? 13.300,
      dest_lat:   pool?.dest_lat   ?? -8.900,
      departure:  pool?.scheduled_for || new Date().toISOString()
    };

    const res = await fetch('/api/driver/pool/suggestions', { method:'POST', headers, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) return setMsg(json.error || 'Failed to get suggestions');
    setSuggestions(json.suggestions || []);
  }

  async function addAllToPool() {
    if (!selectedPool) return;
    const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };

    for (const s of suggestions) {
      // we assume the suggestion rows contain ride_id & requester_id
      await fetch('/api/driver/pool/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ pool_id: selectedPool.id, ride_id: s.ride_id, user_id: s.requester_id })
      });
    }
    setMsg('Added all to pool.');
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">My Pools</h1>
        <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => window.location.href = '/driver/pools/create'}>
          Create Pool
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {pools.map(p => (
          <div key={p.id} className="border rounded p-3">
            <p className="font-medium">Pool: {p.id}</p>
            <p className="text-xs">Seats: {p.available_seats}</p>
            <p className="text-xs">When: {p.scheduled_for}</p>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>fetchSuggestions(p)}>Get Suggestions</button>
            </div>
          </div>
        ))}
      </div>

      {selectedPool && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Suggestions for Pool {selectedPool.id}</h2>
          <div className="space-y-2">
            {suggestions.map(s => (
              <div key={s.ride_id} className="border rounded p-2 text-sm">
                Ride {s.ride_id} — origin Δ {Math.round(s.origin_distance_m)}m, dest Δ {Math.round(s.destination_distance_m)}m
              </div>
            ))}
          </div>
          <button className="mt-3 px-3 py-1 rounded bg-green-600 text-white" onClick={addAllToPool}>
            Add All
          </button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>
      )}
    </div>
  );
}
