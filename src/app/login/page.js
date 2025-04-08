'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    console.log("Sign in with google redirectTo", `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          flow: 'pkce',
        },
      });

      if (error) throw error;
      console.log('Google OAuth initiated:', data);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-full bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-muted border border-muted-foreground/20 rounded-xl p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex w-full justify-center items-center rounded-md bg-white dark:bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-muted-foreground/30 hover:bg-muted transition disabled:opacity-50"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}