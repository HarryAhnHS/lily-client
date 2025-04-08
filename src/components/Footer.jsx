"use client"

import { TwitterIcon, GithubIcon, LinkedinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full border-t bg-background px-4 py-3 text-muted-foreground text-xs z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} IEP Tracker. All rights reserved.</p>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <TwitterIcon className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <GithubIcon className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <LinkedinIcon className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}