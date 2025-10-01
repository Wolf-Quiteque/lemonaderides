'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadClaims() {
    setLoading(true); setError('');
    const { data, error } = await supabase
      .from('ride_claims')
      .select('*, rides(*)')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setClaims(data || []);
    setLoading(false);
  }

  useEffect(() => { loadClaims(); }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">My Claims</h1>
      {!claims.length && <p>No claims yet.</p>}
      {claims.map(c => (
        <div key={c.id} className="border rounded p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Ride {c.ride_id}</p>
              {c.rides && (
                <p className="text-sm text-gray-600">
                  {c.rides.origin} → {c.rides.destination} ({c.rides.status})
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Claim status: {c.status}</p>
            </div>
            <span className="text-xs bg-gray-100 rounded px-2 py-1">{new Date(c.created_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
