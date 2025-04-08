// app/layout.js
'use client';

import { AuthProvider } from '@/app/context/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className='bg-background text-foreground flex flex-col min-h-screen'>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <main className='flex-1 mt-16 min-h-screen flex'>
              <Sidebar />
              <div className='flex-1 flex flex-col'>
                <Header />
                <div className='ml-36 flex-1 min-h-screen p-6'>
                  {children}
                </div>
                <Footer />
              </div>
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}