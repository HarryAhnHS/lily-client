// src/app/page.js - root authenticated page
'use client';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase'; // <- frontend supabase-js client

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow space-y-6">
        <h1 className="text-center text-3xl font-bold">Welcome to Mirae Client</h1>
        {session ? (
          <>
            <p className="text-center">Logged in as: <strong>{session.user.email}</strong></p>
            <button
              onClick={handleSignOut}
              className="w-full rounded bg-red-600 text-white py-2 hover:bg-red-700"
            >
              Sign Out
            </button>
          </>
        ) : (
          <p className="text-center">You are not logged in.</p>
        )}
      </div>
    </div>
  );
}