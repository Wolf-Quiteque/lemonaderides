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
      // 1) Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('No auth user returned');

      // 2) Put role into JWT metadata so RLS/middleware see it
      // NOTE: this sets user_metadata.role; our RLS helper reads it from the JWT.
      const jwtRole = (userRole === 'driver') ? 'driver' : 'employee';
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { role: jwtRole, full_name: formData.name, phone: formData.phone, company_id: formData.company }
      });
      if (metaErr) throw metaErr;

      // 3) Create row in public.users
      const { error: profileError } = await supabase.from('users').insert([{
        id: authData.user.id,
        email: formData.email,
        full_name: formData.name,
        role: jwtRole,              // 'driver' or 'employee'
        phone: formData.phone,
        company_id: formData.company,
      }]);
      if (profileError) throw profileError;

      // 4) If driver, create driver_profiles row
      if (userRole === 'driver') {
        const year = parseInt(formData.vehicleYear || '0', 10) || null;
        const { error: driverErr } = await supabase.from('driver_profiles').insert([{
          user_id: authData.user.id,
          driver_license: formData.driverLicense,
          vehicle_make: formData.vehicleMake,
          vehicle_model: formData.vehicleModel,
          vehicle_year: year,
          license_plate: formData.licensePlate,
          max_passengers: 4
        }]);
        if (driverErr) throw driverErr;
      }

      // 5) Redirect
      if(jwtRole === 'driver'){
        router.push(`/driver/dashboard`);
      }
      else{
   router.push(`/`);
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
