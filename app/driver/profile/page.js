'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { DriverLayout } from '../../../components/layout/driver-layout';
import { Button } from '../../../components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your account details.
          </p>
        </div>
        <div className="bg-card p-4 sm:p-6 rounded-lg border">
          <div className="space-y-4">
            <div>
              <h2 className="font-medium">Email</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            {/* Add other profile details here as needed */}
            <Button onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
