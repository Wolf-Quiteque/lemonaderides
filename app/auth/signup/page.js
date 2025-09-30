// app/auth/signup/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase.js';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    company: '',
    employeeId: '',
    driverLicense: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('rider');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role && ['rider', 'driver'].includes(role)) {
      setUserRole(role);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              name: formData.name,
              role: userRole === 'driver' ? 'driver' : 'employee',
              phone_number: formData.phone,
            },
          ]);

        if (profileError) throw profileError;

        // 3. Create role-specific profile
        const profileData = {
          user_id: authData.user.id,
          profile_type: userRole,
          company_id: formData.company,
          employee_id: formData.employeeId,
        };

        if (userRole === 'driver') {
          profileData.driver_license = formData.driverLicense;
          profileData.vehicle_make = formData.vehicleMake;
          profileData.vehicle_model = formData.vehicleModel;
          profileData.vehicle_year = parseInt(formData.vehicleYear);
          profileData.license_plate = formData.licensePlate;
          profileData.max_passengers = 4;
        }

        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .insert([profileData]);

        if (userProfileError) throw userProfileError;

        // 4. Redirect to appropriate dashboard
        router.push(`/auth/verify-email?role=${userRole}`);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign up as {userRole === 'driver' ? 'Driver' : 'Rider'}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {userRole === 'driver'
              ? 'Join our driver community'
              : 'Start booking rides today'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="john@company.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="Your Company Inc."
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-foreground">
                Employee ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                placeholder="EMP12345"
                value={formData.employeeId}
                onChange={handleInputChange}
              />
            </div>

            {/* Driver-Specific Fields */}
            {userRole === 'driver' && (
              <>
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium mb-4">Driver Information</h4>

                  <div>
                    <label htmlFor="driverLicense" className="block text-sm font-medium text-foreground">
                      Driver's License Number
                    </label>
                    <input
                      id="driverLicense"
                      name="driverLicense"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="D123456789"
                      value={formData.driverLicense}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vehicleMake" className="block text-sm font-medium text-foreground">
                        Vehicle Make
                      </label>
                      <input
                        id="vehicleMake"
                        name="vehicleMake"
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                        placeholder="Toyota"
                        value={formData.vehicleMake}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="vehicleModel" className="block text-sm font-medium text-foreground">
                        Vehicle Model
                      </label>
                      <input
                        id="vehicleModel"
                        name="vehicleModel"
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                        placeholder="Camry"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vehicleYear" className="block text-sm font-medium text-foreground">
                        Vehicle Year
                      </label>
                      <input
                        id="vehicleYear"
                        name="vehicleYear"
                        type="number"
                        required
                        min="2000"
                        max="2024"
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                        placeholder="2022"
                        value={formData.vehicleYear}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="licensePlate" className="block text-sm font-medium text-foreground">
                        License Plate
                      </label>
                      <input
                        id="licensePlate"
                        name="licensePlate"
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                        placeholder="ABC123"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? 'Creating account...' : `Sign up as ${userRole === 'driver' ? 'Driver' : 'Rider'}`}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
