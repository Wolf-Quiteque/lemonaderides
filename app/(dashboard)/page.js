// app/(dashboard)/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RideCard } from '../../components/rides/ride-card.js';
import { Button } from '../../components/ui/button.js';
import { supabase } from '../../lib/supabase.js';
import { Car, MapPin, Plus, User } from 'lucide-react';
import { MobileLayout } from '../../components/layout/mobile-layout.js';

export default function DashboardPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
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

    // Get user data including full_name
    const { data: userInfo } = await supabase
      .from('users')
      .select('role, full_name, email')
      .eq('id', session.user.id)
      .single();

    setUserRole(userInfo?.role);
    setUserData(userInfo);

    if (userInfo) {
      fetchRides(session.user.id);
    } else {
      router.push('/auth/setup-profile');
    }
  };

  const fetchRides = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRides(data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);

      if (error) throw error;
      
      // Refresh rides
      if (user) {
        fetchRides(user.id);
      }
    } catch (error) {
      alert('Error cancelling ride: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 mb-6">Please complete your profile to start using RideShare</p>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/auth/setup-profile')}
          >
            Setup Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Hello, {userData?.full_name || 'User'}!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{userData?.email}</p>
          </div>
        </div>
      </div>

      {/* Request Ride Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Where to?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Request a ride and get there safely</p>
          <Button
            onClick={() => router.push('/rides/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-6 w-6" />
            <span>Request a Ride</span>
          </Button>
        </div>
      </div>

      {/* Your Rides Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your Rides</h3>
          {rides.length > 0 && (
            <Button
              variant="outline"
              onClick={() => router.push('/rides')}
              className="text-sm"
            >
              View All
            </Button>
          )}
        </div>

        {rides.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {rides.slice(0, 1).map((ride) => (
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
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No rides yet</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Your ride history will appear here</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 mt-6">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}
    </MobileLayout>
  );
}
