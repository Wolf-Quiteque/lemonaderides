// app/auth/setup-profile/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase.js';

export default function SetupProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    employeeId: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('No user found');

            // Create user profile in database
            const { error: dbError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  full_name: formData.name,
                  role: formData.role,
                  phone: formData.phone,
                  company_id: formData.company,
                },
              ]);

      if (dbError) throw dbError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: user.id,
            profile_type: formData.role === 'driver' ? 'driver' : 'rider',
            company_id: formData.company,
            employee_id: formData.employeeId,
          },
        ]);

      if (profileError) throw profileError;

      // Redirect to appropriate dashboard
      router.push(formData.role === 'driver' ? '/driver/dashboard' : '/dashboard');

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We need some additional information to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded">
              {error}
            </div>
          )}

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
              value={formData.name}
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
              value={formData.employeeId}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground">
              Role
            </label>
            <select
              id="role"
              name="role"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="employee">Rider (Employee)</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
