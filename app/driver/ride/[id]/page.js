'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { DriverLayout } from '../../../../components/layout/driver-layout';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { MapPin, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

export default function InProgressRide() {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching ride details:', error);
        // Redirect if ride not found or error
        router.push('/driver/schedule');
        return;
      }

      setRide(data);
      setLoading(false);
    };

    fetchRideDetails();
  }, [id, router]);

  const handleEndRide = async () => {
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', ride.id);

    if (error) {
      console.error('Error completing ride:', error);
      // Handle error, maybe show a notification
    } else {
      // On success, navigate back to the schedule
      router.push('/driver/schedule');
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ride details...</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ride in Progress</h1>
          <p className="text-muted-foreground">
            Focus on the journey ahead.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <span>{ride.origin} to {ride.destination}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {ride.scheduled_for ? format(new Date(ride.scheduled_for), 'MMM dd, yyyy HH:mm') : '—'}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {ride.seats_required} seat{ride.seats_required > 1 ? 's' : ''}
              </div>
            </div>
            {/* Placeholder for a map component */}
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Map placeholder</p>
            </div>
            <Button onClick={handleEndRide} size="lg" className="w-full" variant="destructive">
              End Ride
            </Button>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
