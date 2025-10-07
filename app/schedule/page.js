'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { MobileLayout } from '../../components/layout/mobile-layout.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { MapPin, Clock, User, Car } from 'lucide-react';
import { format } from 'date-fns';

export default function ActiveRideTracker() {
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchActiveRide = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('requester_id', session.user.id)
        .eq('status', 'in_progress')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching active ride:', error);
      }

      setActiveRide(data);
      setLoading(false);
    };

    checkAuthAndFetchActiveRide();
  }, [router]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking for active rides...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Your Active Ride</h1>
        {activeRide ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span>{activeRide.origin} to {activeRide.destination}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {activeRide.scheduled_for ? format(new Date(activeRide.scheduled_for), 'MMM dd, yyyy HH:mm') : '—'}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {activeRide.seats_required} seat{activeRide.seats_required > 1 ? 's' : ''}
                </div>
              </div>
               <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <Car className="h-4 w-4" />
                  <span>Your ride is on the way!</span>
                </div>
              {/* Placeholder for a map component */}
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Live map placeholder</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">You have no active rides at the moment.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
