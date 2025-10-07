'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { RideCard } from "../../../components/rides/ride-card";
import { DriverLayout } from "../../../components/layout/driver-layout";

export default function DriverSchedule() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      await fetchAcceptedRides(session.user.id);
      setLoading(false);
    };

    checkAuthAndFetchRides();
  }, [router]);

  const fetchAcceptedRides = async (driverId) => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("driver_id", driverId)
      .in("status", ["assigned", "in_progress", "completed"])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching accepted rides:", error);
    } else {
      setAcceptedRides(data);
    }
    setIsFetching(false);
  };

  const handleUpdateRideStatus = async (ride, newStatus, onSuccess) => {
    const { error } = await supabase
      .from('rides')
      .update({ status: newStatus })
      .eq('id', ride.id);

    if (error) {
      console.error(`Error updating ride status to ${newStatus}:`, error);
      // Optionally, show an error message to the user
    } else {
      if (onSuccess) {
        onSuccess();
      } else {
        // Refresh the list of rides to reflect the change
        await fetchAcceptedRides(user.id);
      }
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Schedule</h1>
          <p className="text-muted-foreground">
            A list of your accepted rides.
          </p>
        </div>
        <div className="bg-card p-4 sm:p-6 rounded-lg border">
          {isFetching && acceptedRides.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your schedule...</p>
            </div>
          ) : acceptedRides.length > 0 ? (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto">
              {acceptedRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  viewAs="driver"
                  showActions={true}
                  onAction={(action, ride) => {
                    if (action === 'start') {
                      handleUpdateRideStatus(ride, 'in_progress', () => {
                        router.push(`/driver/ride/${ride.id}`);
                      });
                    } else if (action === 'end') {
                      handleUpdateRideStatus(ride, 'completed');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You have no scheduled rides.
              </p>
              <p className="text-sm text-muted-foreground">
                Accepted rides will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
