// app/auth/login/page.js (UPDATED)
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectUser(session.user.id);
      }
    };

    checkSession();
  }, []);

const redirectUser = async (userId) => {
  try {
    // 1) Get user role from DB
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

   

    if (userError) {
      console.error('Error fetching user role:', userError);
      router.push('/auth/setup-profile');
      return;
    }

    // 2) Put role into JWT metadata so middleware (and RLS) can see it
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { role: user.role }  // <- critical line
    });
    if (metaErr) {
      console.error('updateUser metadata error:', metaErr);
      // proceed anyway, but middleware may still fail without refresh
    }

    // REMOVED THE BARE 'return' HERE ✓
    
    // 3) Refresh session so access token includes the updated claim
    await supabase.auth.refreshSession();

    // 4) Now the middleware can read the correct role from the token
    switch (user.role) {
      case 'driver':
        router.push('/driver/dashboard');
        break;
      case 'supervisor':
        router.push('/supervisor/dashboard');
        break;
      case 'admin':
        router.push('/admin/dashboard');
        break;
      default:
        router.push('/'); // employee
    }
  } catch (error) {
    console.error('Redirect error:', error);
    router.push('/');
  }
};


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log('Login successful, user:', data.user);

        // Wait a moment for the session to be set
        console.log(data.user);
        setTimeout(() => {
          redirectUser(data.user.id);
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
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
            Sign in to RideShare
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Access your rider or driver account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/role-selection')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
