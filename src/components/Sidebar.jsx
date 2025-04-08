"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Students", href: "/students" },
  { label: "Reports", href: "/reports" },
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="w-36 h-screen border-r bg-background px-4 py-6 fixed z-50">
      <nav className="space-y-2">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "block rounded px-3 py-2 text-sm hover:bg-muted transition",
              pathname === href && "bg-muted font-medium"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}