'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, User, Car, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { RideMap } from '@/components/maps/ride-map'; // Assuming this component exists and can display a single ride

export default function TrackRidePage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchRide = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRide(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRide();

    const channel = supabase
      .channel(`ride_updates:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${id}` },
        (payload) => {
          setRide(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-2 text-gray-600">Loading ride details...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="text-center p-4 text-red-600">
          <p>Error: {error}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
      </MobileLayout>
    );
  }

  if (!ride) {
    return (
      <MobileLayout>
        <div className="text-center p-4 text-gray-600">
          <p>Ride not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
      </MobileLayout>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
    assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900',
    in_progress: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
  };

  return (
    <MobileLayout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Track Your Ride</h1>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4 min-w-0">
            <CardTitle className="text-lg flex gap-2 min-w-0 text-gray-900 dark:text-gray-100 flex-1">
              <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium">{ride.origin}</span>
                <span className="text-sm text-gray-500 truncate dark:text-gray-400">{ride.destination}</span>
              </div>
            </CardTitle>
            <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusColors[ride.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
              {String(ride.status || '').replace('_', ' ')}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {ride.scheduled_for ? format(new Date(ride.scheduled_for), 'MMM dd, yyyy HH:mm') : '—'}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {ride.seats_required} seat{ride.seats_required > 1 ? 's' : ''}
            </div>
            {ride.driver_id && (
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                Driver assigned
              </div>
            )}
          </div>
          {ride.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{ride.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Map Component - Placeholder for now */}
      {ride.origin_lat && ride.origin_long && ride.destination_lat && ride.destination_long && (
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden mb-6">
          {/* Assuming RideMap can take origin/destination coordinates */}
          <RideMap
            origin={{ lat: ride.origin_lat, lng: ride.origin_long }}
            destination={{ lat: ride.destination_lat, lng: ride.destination_long }}
            driverLocation={ride.driver_lat && ride.driver_long ? { lat: ride.driver_lat, lng: ride.driver_long } : null}
          />
        </div>
      )}

      {/* Display Driver Info if assigned */}
      {ride.driver_id && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">Driver ID: {ride.driver_id}</p>
            {/* TODO: Fetch and display driver's name and vehicle details */}
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}
