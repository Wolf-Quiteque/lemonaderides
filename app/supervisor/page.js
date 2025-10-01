'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getAuthHeader } from '../../lib/authHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MapPin, Clock, User, Calendar, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function SupervisorQueue() {
  const [rides, setRides] = useState([]);
  const [note, setNote] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  async function load() {
    setLoading(true);
    try {
      // Fetch pending rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (ridesError) {
        console.error('Error fetching rides:', ridesError);
        setRides([]);
        return;
      }

      if (!ridesData || ridesData.length === 0) {
        setRides([]);
        return;
      }

      // Fetch user data for each ride
      const ridesWithUsers = await Promise.all(
        ridesData.map(async (ride) => {
          if (ride.requester_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('full_name, email, phone, company_id')
              .eq('id', ride.requester_id)
              .single();
            
            if (!userError && userData) {
              return { ...ride, requester: userData };
            }
          }
          return { ...ride, requester: null };
        })
      );
      
      setRides(ridesWithUsers);

      // Fetch stats for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: statsData } = await supabase
        .from('approvals')
        .select('status')
        .gte('created_at', today.toISOString());

      if (statsData) {
        const newStats = {
          pending: ridesData?.length || 0,
          approved: statsData.filter(s => s.status === 'approved').length,
          rejected: statsData.filter(s => s.status === 'rejected').length
        };
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error loading rides:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    
    // Set up real-time subscription for new pending rides
    const subscription = supabase
      .channel('supervisor-rides')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rides', filter: 'status=eq.pending' },
        () => load()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function decide(ride_id, status) {
    setProcessing(prev => ({ ...prev, [ride_id]: true }));
    try {
      const headers = { 
        'Content-Type': 'application/json', 
        ...(await getAuthHeader()) 
      };
      const body = { 
        ride_id, 
        status, 
        notes: note[ride_id] || null 
      };
      
      const res = await fetch('/api/supervisor/approve', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(body) 
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        alert(json.error || 'Failed to process request');
      } else {
        // Clear the note for this ride
        setNote(prev => {
          const newNotes = { ...prev };
          delete newNotes[ride_id];
          return newNotes;
        });
        await load();
      }
    } catch (err) {
      console.error('Error processing ride:', err);
      alert('An error occurred while processing the request');
    } finally {
      setProcessing(prev => ({ ...prev, [ride_id]: false }));
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 sm:w-1/4"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-6">
      {/* Header - Mobile First */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Title Section */}
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Review and approve ride requests</p>
          </div>
          
          {/* Stats Section - Responsive Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center px-2 sm:px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-[10px] sm:text-xs text-yellow-600">Pending</div>
            </div>
            <div className="text-center px-2 sm:px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.approved}</div>
              <div className="text-[10px] sm:text-xs text-green-600">Approved</div>
            </div>
            <div className="text-center px-2 sm:px-4 py-2 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xl sm:text-2xl font-bold text-red-700">{stats.rejected}</div>
              <div className="text-[10px] sm:text-xs text-red-600">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {rides.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-sm sm:text-base text-gray-600">No pending ride requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {rides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-400">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  {/* Mobile: Stack vertically, Desktop: Side by side */}
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-start sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Ride ID and Status */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg">
                          <span className="hidden sm:inline">Ride Request </span>
                          #{ride.id.slice(0, 8)}
                        </CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ride.status]}`}>
                          {ride.status}
                        </span>
                      </div>
                      
                      {/* Requester Info */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="font-medium">{ride.requester?.full_name || 'Unknown'}</span>
                        {ride.requester?.email && (
                          <span className="text-gray-400 hidden sm:inline">• {ride.requester.email}</span>
                        )}
                      </div>
                      
                      {/* Email on mobile - separate line */}
                      {ride.requester?.email && (
                        <div className="text-xs text-gray-400 mt-1 sm:hidden truncate">
                          {ride.requester.email}
                        </div>
                      )}
                    </div>
                    
                    {/* Request Time */}
                    <div className="text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Requested </span>
                        {format(new Date(ride.created_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  {/* Route Information - Mobile Optimized */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-1 shrink-0">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                        <div className="w-0.5 h-6 sm:h-8 bg-gray-300 mx-auto my-1"></div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                      </div>
                      <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                        <div>
                          <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Pickup Location</div>
                          <div className="font-medium text-sm sm:text-base text-gray-900 break-words">{ride.origin}</div>
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Dropoff Location</div>
                          <div className="font-medium text-sm sm:text-base text-gray-900 break-words">{ride.destination}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details - Mobile: Stack, Desktop: Grid */}
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-500">Scheduled For</div>
                        <div className="font-medium truncate">
                          {ride.scheduled_for 
                            ? format(new Date(ride.scheduled_for), 'MMM dd, yyyy HH:mm')
                            : 'ASAP'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" />
                      <div>
                        <div className="text-[10px] sm:text-xs text-gray-500">Seats Required</div>
                        <div className="font-medium">{ride.seats_requested} seat{ride.seats_requested > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Requester Notes */}
                  {ride.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] sm:text-xs font-medium text-blue-900 mb-1">Requester Notes</div>
                          <p className="text-xs sm:text-sm text-blue-800 break-words">{ride.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supervisor Notes Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Supervisor Notes {note[ride.id] && <span className="text-red-600">(Required for rejection)</span>}
                    </label>
                    <textarea
                      placeholder="Add notes or rejection reason..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="3"
                      value={note[ride.id] || ''}
                      onChange={(e) => setNote(prev => ({ ...prev, [ride.id]: e.target.value }))}
                    />
                  </div>

                  {/* Action Buttons - Mobile: Stack, Desktop: Side by side */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <Button
                      className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-2.5 sm:py-2"
                      onClick={() => decide(ride.id, 'approved')}
                      disabled={processing[ride.id]}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing[ride.id] ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full sm:flex-1 text-sm sm:text-base py-2.5 sm:py-2"
                      onClick={() => {
                        if (!note[ride.id]?.trim()) {
                          alert('Please provide a reason for rejection');
                          return;
                        }
                        decide(ride.id, 'rejected');
                      }}
                      disabled={processing[ride.id]}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processing[ride.id] ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
