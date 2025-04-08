"use client"

import { ModeToggle } from "@/components/ModeToggle"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from '@/services/supabase';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export const Header = () => {
  const { session, loading } = useAuth();

  const router = useRouter();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Mirae</span>
        </div>
        
        <div className="flex items-center gap-4">
          {!loading && session?.user ? (
            <>  
              <div className="text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{session.user.email}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => router.push('/login')}>Log In</Button>
          )}
          {!loading && session?.user && (
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}