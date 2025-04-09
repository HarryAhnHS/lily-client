"use client"

import { ModeToggle } from "@/components/ModeToggle"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from '@/services/supabase';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useSidebarContext } from '@/app/context/sidebar-context';

export const Header = () => {
  const { session, loading } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebarContext();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 justify-end items-center gap-4 px-4">
        
        <div className="flex items-center gap-4">
          {!loading && session?.user && (
            <>  
              <div className="text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{session.user.email}</span>
              </div>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}