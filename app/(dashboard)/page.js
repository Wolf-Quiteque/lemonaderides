// app/(dashboard)/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RideCard } from '../../components/rides/ride-card.js';
import { Button } from '../../components/ui/button.js';
import { supabase } from '../../lib/supabase.js';
import { Car, MapPin, Plus, LogOut, User } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RideShare</h1>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Hello, {userData?.full_name || 'User'}!
              </h2>
              <p className="text-sm text-gray-600">{userData?.email}</p>
            </div>
          </div>
        </div>

        {/* Request Ride Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-200">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Where to?</h2>
            <p className="text-gray-600 mb-6">Request a ride and get there safely</p>
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
            <h3 className="text-xl font-bold text-gray-900">Your Rides</h3>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rides.slice(0, 6).map((ride) => (
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
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No rides yet</h3>
              <p className="text-gray-600 text-sm">Your ride history will appear here</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
