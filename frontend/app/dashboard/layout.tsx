'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Link2, Share2, Users } from 'lucide-react'

import { logout, getToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const routes = [
  { href: '/dashboard', label: 'Pulse', icon: LayoutDashboard, emoji: '📊' },
  { href: '/dashboard/accounts', label: 'Connect', icon: Share2, emoji: '🔗' },
  { href: '/dashboard/leads', label: 'Leads', icon: Users, emoji: '🔥' },
  { href: '/dashboard/integrations', label: 'Sync', icon: Link2, emoji: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative">
                <Logo className="h-14 w-14" />
                <span className="absolute inset-0 animate-ping rounded-2xl bg-[#A855F7]/40" />
              </div>
              <div>
                <p className="font-display text-lg text-white">FLOW IA</p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Social AI Ops</p>
              </div>
            </Link>
            <Badge variant="ghost" className="hidden items-center gap-1 text-xs text-white/60 md:flex">
              ⚡ Squad Boss Mode
            </Badge>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/5 p-1">
            {routes.map((route) => {
              const active = pathname.startsWith(route.href)
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                    active ? 'bg-white text-[#050914]' : 'text-white/55 hover:text-white'
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{route.label}</span>
                  <span className="md:hidden">{route.emoji}</span>
                </Link>
              )
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}

