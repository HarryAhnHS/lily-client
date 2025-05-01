"use client"

import { ModeToggle } from "@/components/ModeToggle"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from '@/services/supabase';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { useSidebarContext } from '@/app/context/sidebar-context';
import { Logo } from "@/components/Logo";
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const Header = () => {
  const { session, loading } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebarContext();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="flex h-16 items-center justify-between px-4 py-8">
        <Logo />
        
        <div className="flex items-center gap-4">
          {!loading && session?.user && (
            <>  
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Avatar className="h-8 w-8 border">
                  {session.user.user_metadata.avatar_url ? (
                    <AvatarImage 
                      src={session.user.user_metadata.avatar_url}
                      alt={session.user.user_metadata.full_name || "User"}
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                Welcome, <span className="font-medium text-foreground">{session.user.user_metadata.full_name}</span>
              </div>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}