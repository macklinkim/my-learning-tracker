'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Kanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',       icon: LayoutDashboard, label: '대시보드' },
  { href: '/items',  icon: List,            label: '학습 목록' },
  { href: '/kanban', icon: Kanban,          label: '칸반 보드' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            pathname === href
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
