'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { MobileLayout } from '../../components/layout/mobile-layout.js';
import { RideCard } from '../../components/rides/ride-card.js';
import { Button } from '../../components/ui/button.js';

export default function RidesPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRides = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('rides')
          .select('*')
          .eq('requester_id', user.id)
          .order('created_at', { ascending: false });
        setRides(data || []);
      }
      setLoading(false);
    };
    fetchRides();
  }, []);

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-[60vh] flex items-center justify-center">Loading rides...</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
<div className="space-y-4 dark:bg-gray-900 dark:text-gray-100">
<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Rides</h2>

        {rides.length === 0 ? (
<div className="text-center py-12">
  <p className="mb-4 text-gray-700 dark:text-gray-300">No rides yet</p>
  <Button onClick={() => router.push('/rides/new')}>Schedule Your First Ride</Button>
</div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onAction={(action) => {
                  if (action === 'edit') router.push(`/rides/${ride.id}/edit`);
                  if (action === 'cancel') router.refresh();
                  if (action === 'track') router.push(`/rides/${ride.id}/track`);
                }}
              />
            ))}
          </div>
        )}

        <div className="h-2" />
      </div>
    </MobileLayout>
  );
}
