'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { DriverLayout } from '../../../components/layout/driver-layout';
import { RideCard } from '../../../components/rides/ride-card';
import { useRouter } from 'next/navigation';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchClaims = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      await loadClaims(session.user.id);
      setLoading(false);
    };
    checkAuthAndFetchClaims();
  }, [router]);

  async function loadClaims(userId) {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('ride_claims')
      .select('*, rides(*)')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      console.error('Error fetching claims:', error);
    } else {
      setClaims(data.map(claim => ({ ...claim.rides, claim_status: claim.status })));
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your claims...</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  if (error) {
    return (
      <DriverLayout>
        <div className="p-6 text-red-600 text-center">
          <p>Failed to load claims: {error}</p>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Claims</h1>
          <p className="text-muted-foreground">
            Rides you have claimed, awaiting assignment.
          </p>
        </div>
        <div className="bg-card p-4 sm:p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Claimed Rides</h2>
          {claims.length > 0 ? (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto">
              {claims.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  viewAs="driver"
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You haven't claimed any rides yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Claimed rides will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
