// app/layout.js
'use client';

import { AuthProvider } from '@/app/context/auth-context';
import { SidebarProvider } from '@/app/context/sidebar-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import FlowerChain from '@/components/FlowerChain';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SidebarProvider>
              
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 pt-16 pl-24 pr-4">
                <FlowerChain />
                  {children}
                </main>
                <Footer />
                <Sidebar />
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}