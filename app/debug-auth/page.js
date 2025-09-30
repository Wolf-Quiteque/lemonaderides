// app/debug-auth/page.js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function DebugAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        // Check if user exists in database
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setDbUser(userData);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setDbUser(userData);
        } else {
          setDbUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Auth Session</h2>
          <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Database User</h2>
          <pre className="text-sm">{JSON.stringify(dbUser, null, 2)}</pre>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Auth State</h2>
        <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
        <p>Database Record: {dbUser ? 'Exists' : 'Missing'}</p>
        <p>User Role: {dbUser?.role || 'Unknown'}</p>
      </div>

      {user && (
        <div className="space-x-2">
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Sign Out
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
