"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FileText,
  LogOut,
  Menu,
} from 'lucide-react';

import { useSidebarContext } from '@/app/context/sidebar-context';
import { Button } from './ui/button';
import { supabase } from '@/services/supabase';
import { useRouter } from 'next/navigation';
export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebarContext();
  const pathname = usePathname();
  const router = useRouter();
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };



  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
        isExpanded ? "w-48" : "w-16",
        "transform-gpu"
      )}
    >
        <div className="h-full space-y-4 pt-4 pb-16">
            <div className="h-full px-3 py-2 flex flex-col gap-2">
                {/* Buttons start here */}
                <div className="space-y-2 flex-1">
                    {/* Nav Items */}
                    {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground",
                        !isExpanded && "justify-center"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", isExpanded && "mr-2")} />
                        <span className={cn(
                            "transition-all duration-200 overflow-hidden",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                    ))}

                    {/* Sign Out Button */}
                    <a
                    onClick={handleSignOut}
                    className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        "text-muted-foreground cursor-pointer ",
                        !isExpanded && "justify-center"
                    )}
                    >
                        <LogOut className={cn("h-4 w-4", isExpanded && "mr-2")} />
                        <span className={cn(
                            "transition-all duration-200 overflow-hidden h-[20px]",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            Sign Out
                        </span>
                    </a>
                </div>
            </div>
        </div>
    </aside>
  );
}