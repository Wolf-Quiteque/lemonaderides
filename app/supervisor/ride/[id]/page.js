'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase.js';
import { getAuthHeader } from '@/lib/authHeader';

export default function RideDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');

      // Load ride
      const { data: rideData, error: rideErr } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id)
        .single();
      if (rideErr) throw new Error(rideErr.message);
      setRide(rideData);

      // Load claims for this ride
      const { data: claimData, error: claimErr } = await supabase
        .from('ride_claims')
        .select('id, driver_id, status, created_at')
        .eq('ride_id', id)
        .order('created_at', { ascending: false });
      if (claimErr) throw new Error(claimErr.message);
      setClaims(claimData || []);
    } catch (e) {
      setError(e.message || 'Failed to load ride');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function assignWinner(driver_id) {
    try {
      setAssigning(true);
      setMessage('');
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
      const res = await fetch('/api/supervisor/assign', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ride_id: id, driver_id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to assign');
      setMessage('Driver assigned successfully.');
      // Optionally refresh ride to reflect new status
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!ride) return <div className="p-6">Ride not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ride Details</h1>
        <button className="text-sm underline" onClick={() => router.push('/supervisor')}>← Back to list</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ride ID: {ride.id}</p>
              <p className="text-sm text-gray-600">From: {ride.origin}</p>
              <p className="text-sm text-gray-600">To: {ride.destination}</p>
            </div>
            <span className="text-xs bg-gray-100 rounded px-2 py-1">{ride.status}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>Seats requested: {ride.seats_requested}</p>
            {ride.scheduled_for && <p>Scheduled for: {new Date(ride.scheduled_for).toLocaleString()}</p>}
            {ride.rejection_reason && <p className="text-red-700">Rejection reason: {ride.rejection_reason}</p>}
          </div>
        </div>

        <div className="border rounded p-4">
          <p className="text-sm font-medium mb-2">Actions</p>
          <p className="text-xs text-gray-600">Assign the winning driver from the claims list.</p>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-3">Claims</h2>
        {!claims.length && <p className="text-sm">No claims yet.</p>}
        <div className="space-y-2">
          {claims.map(claim => (
            <div key={claim.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <p className="text-sm">Driver: <span className="font-mono">{claim.driver_id}</span></p>
                <p className="text-xs text-gray-500">Status: {claim.status} • {new Date(claim.created_at).toLocaleString()}</p>
              </div>
              <button
                disabled={assigning || ride.status === 'assigned'}
                onClick={() => assignWinner(claim.driver_id)}
                className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {ride.status === 'assigned' ? 'Already Assigned' : (assigning ? 'Assigning…' : 'Assign Winner')}
              </button>
            </div>
          ))}
        </div>
        {message && <p className="text-sm mt-3">{message}</p>}
      </div>
    </div>
  );
}
