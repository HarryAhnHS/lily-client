"use client"

import { useTheme } from "next-themes"
import { ModeToggle } from "@/components/ModeToggle"

export const Header = () => {

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">TooLate.ai</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}