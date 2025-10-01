// app/driver/dashboard/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';
import { RideCard } from '../../../components/rides/ride-card';

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableRides, setAvailableRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchRides = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);
      await refreshRides(session.user.id);
      setLoading(false);
    };

    checkAuthAndFetchRides();
  }, [router]);

  const refreshRides = async (userId) => {
    setIsFetching(true);
    await fetchAvailableRides();
    if (userId) {
      await fetchAcceptedRides(userId);
    }
    setIsFetching(false);
  };

  const fetchAvailableRides = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching available rides:', error);
    } else {
      setAvailableRides(data);
    }
  };

  const fetchAcceptedRides = async (driverId) => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['assigned', 'in_progress']);

    if (error) {
      console.error('Error fetching accepted rides:', error);
    } else {
      setAcceptedRides(data);
    }
  };

  const handleAcceptRide = async (ride) => {
    const { data, error } = await supabase
      .from('rides')
      .update({ driver_id: user.id, status: 'assigned' })
      .eq('id', ride.id);

    if (error) {
      console.error('Error accepting ride:', error);
    } else {
      await refreshRides(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Driver Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.email}!</p>
          </div>
          <Button onClick={() => refreshRides(user.id)} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Button asChild variant="outline">
            <Link href="/driver/claims">My Claims</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/driver/pools">My Pools</Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
            {isFetching && availableRides.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading available rides...</p>
              </div>
            ) : availableRides.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {availableRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onAction={(action, r) => {
                      if (action === 'accept') {
                        handleAcceptRide(r);
                      }
                    }}
                    viewAs="driver"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No available rides at the moment.</p>
                <p className="text-sm text-muted-foreground">Check back later or refresh.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Your Schedule</h2>
            {isFetching && acceptedRides.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading your schedule...</p>
              </div>
            ) : acceptedRides.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {acceptedRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You have no scheduled rides.</p>
                <p className="text-sm text-muted-foreground">Accepted rides will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="mt-6"
        >
          Back to Main Dashboard
        </Button>
      </div>
    </div>
  );
}
