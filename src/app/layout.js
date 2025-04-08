// app/layout.js
'use client';

import { AuthProvider } from '@/app/context/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';

export default function RootLayout({ children }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isLoginRoute = pathname.startsWith("/login");
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className='bg-background text-foreground flex flex-col min-h-screen'>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <main className='flex-1 mt-16 min-h-screen flex'>
              {!isLoginRoute && <Sidebar />}
              <div className='flex-1 flex flex-col'>
                <Header />
                <div className={`h-full ${isLoginRoute ? 'ml-0' : 'ml-36'} flex-1 p-6`}>
                  {children}
                </div>
                <Footer/>
              </div>
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}