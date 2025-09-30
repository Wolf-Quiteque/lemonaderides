// app/auth/role-selection/page.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, User } from 'lucide-react';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const proceedToAuth = () => {
    if (selectedRole) {
      router.push(`/auth/signup?role=${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Join RideShare
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Select how you want to use RideShare
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Rider Option */}
          <div
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedRole === 'rider'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleRoleSelect('rider')}
          >
            <User className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold">I need a ride</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Book rides to work, meetings, or events
            </p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li>• Request rides in advance</li>
              <li>• Join ride pools to save</li>
              <li>• Track your driver in real-time</li>
            </ul>
          </div>

          {/* Driver Option */}
          <div
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedRole === 'driver'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleRoleSelect('driver')}
          >
            <Car className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold">I want to drive</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Offer rides and earn while helping colleagues
            </p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li>• Set your own schedule</li>
              <li>• Earn per ride</li>
              <li>• Help reduce company carbon footprint</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.push('/auth/login')}
            className="flex-1 py-2 px-4 border border-input rounded-md hover:bg-accent"
          >
            Already have an account? Sign in
          </button>
          <button
            onClick={proceedToAuth}
            disabled={!selectedRole}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Continue as {selectedRole || '...'}
          </button>
        </div>
      </div>
    </div>
  );
}
