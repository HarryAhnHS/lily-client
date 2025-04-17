"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-black flex flex-col items-center py-8 z-10">
      <div className="mb-16">
        <Link href="/">
          <div className="flex flex-col items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 4C11.5 4 9.5 6 9.5 8.5C9.5 11 11.5 13 14 13C16.5 13 18.5 11 18.5 8.5C18.5 6 16.5 4 14 4Z"
                fill="white"
              />
              <path
                d="M14 15C11.5 15 9.5 17 9.5 19.5C9.5 22 11.5 24 14 24C16.5 24 18.5 22 18.5 19.5C18.5 17 16.5 15 14 15Z"
                fill="white"
              />
              <path
                d="M8.5 9.5C6 9.5 4 11.5 4 14C4 16.5 6 18.5 8.5 18.5C11 18.5 13 16.5 13 14C13 11.5 11 9.5 8.5 9.5Z"
                fill="white"
              />
              <path
                d="M19.5 9.5C17 9.5 15 11.5 15 14C15 16.5 17 18.5 19.5 18.5C22 18.5 24 16.5 24 14C24 11.5 22 9.5 19.5 9.5Z"
                fill="white"
              />
              <circle cx="14" cy="14" r="3.5" fill="white" />
            </svg>
            <span className="text-white text-sm font-medium mt-1">Lily</span>
          </div>
        </Link>
      </div>
      <nav className="flex flex-col items-center gap-10">
        <Link 
          href="/" 
          className={`text-white p-2 rounded-md hover:bg-gray-900 transition-colors ${pathname === '/' ? 'bg-gray-900' : ''}`}
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
        </Link>
        <Link
          href="/students"
          className={`text-white p-2 rounded-md hover:bg-gray-900 transition-colors ${pathname === '/students' ? 'bg-gray-900' : ''}`}
          aria-label="Students"
        >
          <Users className="w-5 h-5" />
        </Link>
        <Link
          href="/settings"
          className={`text-white p-2 rounded-md hover:bg-gray-900 transition-colors ${pathname === '/settings' ? 'bg-gray-900' : ''}`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </nav>
      <div className="mt-auto mb-8">
        <button
          onClick={handleSignOut}
          className="text-white p-2 rounded-md hover:bg-gray-900 transition-colors"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}