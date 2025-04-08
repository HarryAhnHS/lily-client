// app/layout.js
'use client';

import { AuthProvider, useAuth } from '@/app/context/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import './globals.css';

function LayoutShell({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [loading, session, router]);

  if (loading || (!loading && !session)) return <Loader2 />;

  return children;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}