'use client';
import { useState } from 'react';
import { getAuthHeader } from '../../lib/authHeader';
import MapPicker from '../../components/MapPicker';

export default function Dashboard() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originPos, setOriginPos] = useState(null);
  const [destPos, setDestPos] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submitRide(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(await getAuthHeader()),
      };
      const body = {
        origin,
        destination,
        origin_lon: originPos?.lon,
        origin_lat: originPos?.lat,
        dest_lon: destPos?.lon,
        dest_lat: destPos?.lat,
        seats_requested: 1,
      };
      const res = await fetch('/api/rides/request', { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request ride');
      setMsg(`Ride created: ${json.ride.id}`);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Request a Ride</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm mb-1">Origin (text)</label>
          <input className="w-full border rounded p-2" value={origin} onChange={(e)=>setOrigin(e.target.value)} placeholder="e.g., Luanda, ..." />
          <p className="text-xs text-gray-500 mt-1">Or click on the map to set coordinates.</p>
          <div className="mt-3">
            <MapPicker onPick={setOriginPos} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Destination (text)</label>
          <input className="w-full border rounded p-2" value={destination} onChange={(e)=>setDestination(e.target.value)} placeholder="e.g., Talatona, ..." />
          <p className="text-xs text-gray-500 mt-1">Or click on the map to set coordinates.</p>
          <div className="mt-3">
            <MapPicker onPick={setDestPos} />
          </div>
        </div>
      </div>

      <button
        onClick={submitRide}
        disabled={busy}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit ride'}
      </button>

      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  );
}
