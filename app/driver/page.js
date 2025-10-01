'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getAuthHeader } from '../../lib/authHeader';

export default function DriverBrowse() {
  const [rides, setRides] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .in('status', ['approved','open'])
      .order('created_at', { ascending: true });

    if (!error) setRides(data || []);
  }
  useEffect(()=>{ load(); }, []);

  async function claim(ride_id) {
    setMsg('');
    const headers = { 'Content-Type':'application/json', ...(await getAuthHeader()) };
    const res = await fetch('/api/driver/claim', { method: 'POST', headers, body: JSON.stringify({ ride_id }) });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || 'Failed to claim'); else setMsg('Claimed!');
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Available Rides</h1>
      {rides.map(r => (
        <div key={r.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{r.origin} → {r.destination}</p>
            <p className="text-xs text-gray-500">status: {r.status}</p>
          </div>
          <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>claim(r.id)}>Claim</button>
        </div>
      ))}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
