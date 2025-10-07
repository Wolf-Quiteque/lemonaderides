'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { RideCard } from "../../../components/rides/ride-card";
import { Car, LogOut } from "lucide-react";
import { DriverLayout } from "../../../components/layout/driver-layout";

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableRides, setAvailableRides] = useState([]);
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

  const refreshRides = async () => {
    setIsFetching(true);
    await fetchAvailableRides();
    setIsFetching(false);
  };

  const fetchAvailableRides = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching available rides:", error);
    } else {
      setAvailableRides(data);
    }
  };


  const handleAcceptRide = async (ride) => {
    const { data, error } = await supabase
      .from("rides")
      .update({ driver_id: user.id, status: "assigned" })
      .eq("id", ride.id);

    if (error) {
      console.error("Error accepting ride:", error);
    } else {
      await refreshRides(user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}!
            </p>
          </div>
        </div>
        <div className="bg-card p-4 sm:p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Available Rides</h2>
          {isFetching && availableRides.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Loading available rides...
              </p>
            </div>
          ) : availableRides.length > 0 ? (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto">
              {availableRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onAction={(action, r) => {
                    if (action === "accept") {
                      handleAcceptRide(r);
                    }
                  }}
                  viewAs="driver"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No available rides at the moment.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later or refresh.
              </p>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
