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
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SidebarProvider>
              <div className="min-h-screen flex flex-col overflow-hidden">
                <Header />
                <main className={`flex-1 overflow-hidden ${!isLoginPage ? 'pt-16 pl-24 pr-4' : 'pt-16'}`}>
                  {!isLoginPage && <FlowerChain />}
                  {children}
                </main>
                {!isLoginPage && <Footer />}
                {!isLoginPage && <Sidebar />}
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}