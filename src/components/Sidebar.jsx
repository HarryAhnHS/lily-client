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
        "fixed left-0 top-0 h-screen z-100 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
        isExpanded ? "w-48" : "w-16",
        "transform-gpu"
      )}
    >
        <div className="h-full space-y-4 pt-1 pb-16">
            <div className="h-full px-3 py-2 flex flex-col gap-2">
                {/* Buttons start here */}
                <div className="space-y-2 flex-1">
                    <Button
                        onClick={toggleSidebar}
                        variant="ghost"
                        className="gap-0 flex items-center px-3 py-2 rounded-lg transition-all duration-200 
                        text-muted-foreground hover:bg-accent hover:text-accent-foreground justify-center"
                        >
                        <Menu className="h-5 w-5 flex-shrink-0" />
                    </Button>
                    
                    {/* Nav Items */}
                    {navItems.map((item) => (
                    <Button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        variant="ghost"
                        className={cn(
                        "gap-0 flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        isExpanded ? "w-full justify-start" : "justify-center",
                        pathname === item.href && "bg-accent text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span
                        className={cn(
                            "whitespace-nowrap overflow-hidden transition-all duration-300",
                            isExpanded ? "opacity-100 max-w-[200px] ml-2" : "opacity-0 max-w-0 ml-0"
                        )}
                        >
                        {item.label}
                        </span>
                    </Button>
                    ))}

                    {/* Sign Out Button */}
                    <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className={cn(
                        "gap-0 flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        isExpanded ? "w-full justify-start" : "justify-center"
                    )}
                    >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span
                        className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        isExpanded ? "opacity-100 max-w-[200px] ml-2" : "opacity-0 max-w-0 ml-0"
                        )}
                    >
                        Sign Out
                    </span>
                    </Button>
                </div>
            </div>
        </div>
    </aside>
  );
}