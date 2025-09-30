// components/auth/auth-status.js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span>Hello, {user.email}</span>
          <button 
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </>
      ) : (
        <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
          Sign in
        </a>
      )}
    </div>
  );
}