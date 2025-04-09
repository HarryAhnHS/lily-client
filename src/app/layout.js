// app/layout.js
'use client';

import { AuthProvider } from '@/app/context/auth-context';
import { SidebarProvider } from '@/app/context/sidebar-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SidebarProvider>
              <div className="min-h-screen flex">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 pt-16 pl-16 transition-all duration-300">
                    {children}
                  </main>
                  <Footer />
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}