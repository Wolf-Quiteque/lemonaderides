// app/(dashboard)/page.js (UPDATED)
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RideCard } from '../../components/rides/ride-card.js';
import { Button } from '../../components/ui/button.js';
import { supabase } from '../../lib/supabase.js';
import { AuthStatus } from '../../components/auth/auth-status.js';

export default function DashboardPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setUser(session.user);

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(userData?.role);

    if (userData) {
      fetchRides(session.user.id);
    } else {
      // User doesn't exist in database, redirect to setup
      router.push('/auth/setup-profile');
    }
  };

  const fetchRides = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );

  // Show this if user needs to setup profile
  if (!userRole && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Profile Setup Required</h2>
          <p className="text-muted-foreground mt-2">Please complete your profile to continue</p>
          <Button className="mt-4" onClick={() => router.push('/auth/setup-profile')}>
            Setup Profile
          </Button>
        </div>
      </div>
    );
  }

  // ... rest of the component
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">RideShare</h1>
            <AuthStatus />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Rides</h2>
            <Button onClick={() => router.push('/rides/new')}>
              Request New Ride
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onAction={(action, ride) => {
                  switch (action) {
                    case 'edit':
                      router.push(`/rides/${ride.id}/edit`);
                      break;
                    case 'cancel':
                      if (confirm('Are you sure you want to cancel this ride?')) {
                        cancelRide(ride.id);
                        fetchRides(user.id);
                      }
                      break;
                    case 'track':
                      router.push(`/rides/${ride.id}/track`);
                      break;
                  }
                }}
                showActions={true}
              />
            ))}
          </div>

          {rides.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No rides yet</h3>
              <p className="text-gray-600 mt-2">Request your first ride to get started</p>
              <Button className="mt-4" onClick={() => router.push('/rides/new')}>
                Request Ride
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const cancelRide = async (rideId) => {
  try {
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', rideId);

    if (error) throw error;
  } catch (error) {
    alert('Error cancelling ride: ' + error.message);
  }
};
