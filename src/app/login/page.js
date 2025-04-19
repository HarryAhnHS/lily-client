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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-background via-primary/5 to-muted/20 px-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <div className="inline-block w-24 h-24 rounded-full bg-gradient-to-tr from-background to-muted/30 p-5 flex items-center justify-center mb-6 shadow-lg border border-border/20">
            <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
              <path
                d="M14 4C11.5 4 9.5 6 9.5 8.5C9.5 11 11.5 13 14 13C16.5 13 18.5 11 18.5 8.5C18.5 6 16.5 4 14 4Z"
                className="fill-primary"
              />
              <path
                d="M14 15C11.5 15 9.5 17 9.5 19.5C9.5 22 11.5 24 14 24C16.5 24 18.5 22 18.5 19.5C18.5 17 16.5 15 14 15Z"
                className="fill-primary/90"
              />
              <path
                d="M8.5 9.5C6 9.5 4 11.5 4 14C4 16.5 6 18.5 8.5 18.5C11 18.5 13 16.5 13 14C13 11.5 11 9.5 8.5 9.5Z"
                className="fill-primary/80"
              />
              <path
                d="M19.5 9.5C17 9.5 15 11.5 15 14C15 16.5 17 18.5 19.5 18.5C22 18.5 24 16.5 24 14C24 11.5 22 9.5 19.5 9.5Z"
                className="fill-primary/70"
              />
              <circle cx="14" cy="14" r="3.5" className="fill-primary-foreground" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-2 drop-shadow-sm">Lily</h1>
          <p className="text-muted-foreground text-sm">Your AI-powered IEP Progress Tracker</p>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur-md border border-border/30 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-pulse">
              <p className="text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group relative flex w-full justify-center items-center rounded-xl bg-white dark:bg-background/60 p-4 text-sm font-medium text-foreground shadow-lg ring-1 ring-inset ring-border hover:bg-primary/5 transition-all duration-300 hover:shadow-xl disabled:opacity-50 hover:scale-[1.02]"
            >
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
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
              <span className="font-medium">Sign in with Google</span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By signing in, you agree to our <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}