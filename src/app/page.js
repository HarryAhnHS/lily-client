'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading) return <LoadingSpinner />; 

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