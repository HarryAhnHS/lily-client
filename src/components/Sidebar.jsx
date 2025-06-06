"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Settings, LogOut } from 'lucide-react';
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
    <div className="fixed left-5 top-1/2 -translate-y-1/2 rounded-2xl bg-primary/10 shadow-lg z-10 flex flex-col items-center py-5 px-3">
      <nav className="flex flex-col items-center gap-7">
        <Link 
          href="/"  
          className={`text-foreground p-2 rounded-sm hover:bg-primary/15 transition-colors ${pathname === '/' ? 'bg-primary/20' : ''}`}
          aria-label="Home" 
        >
          <Home className="w-5 h-5" />
        </Link>
        <Link
          href="/students"
          className={`text-foreground p-2 rounded-sm hover:bg-primary/15 transition-colors ${pathname === '/students' ? 'bg-primary/20' : ''}`}
          aria-label="Students"
        >
          <User className="w-5 h-5 font-light" />
        </Link>
        <Link
          href="#"
          className={`text-foreground p-2 rounded-sm hover:bg-primary/15 transition-colors ${pathname === '/settings' ? 'bg-primary/20' : ''}`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <button
          onClick={handleSignOut}
          className="text-foreground p-2 rounded-sm hover:bg-primary/10 transition-colors"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}