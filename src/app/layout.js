// app/layout.js
'use client';

import { AuthProvider, useAuth } from '@/app/context/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import './globals.css';

function LayoutShell({ children }) {
  const { loading } = useAuth();

  if (loading) return <Loader2 className="animate-spin mx-auto" />;
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