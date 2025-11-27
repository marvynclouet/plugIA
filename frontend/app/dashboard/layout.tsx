'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Link2, Share2, Users } from 'lucide-react'

import { logout, getToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const routes = [
  { href: '/dashboard', label: 'Pulse', icon: LayoutDashboard, emoji: '📊' },
  { href: '/dashboard/accounts', label: 'Connect', icon: Share2, emoji: '🔗' },
  { href: '/dashboard/interactions', label: 'Interactions', icon: Users, emoji: '💬' },
  { href: '/dashboard/leads', label: 'Leads', icon: Users, emoji: '🔥' },
  { href: '/dashboard/integrations', label: 'Sync', icon: Link2, emoji: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = getToken()
      if (!token) {
        window.location.href = '/login'
        return
      }

      // Vérifier rapidement si le token est valide
      try {
        const response = await api.post('/auth/me')
        if (response.status === 200 && response.data) {
          setIsChecking(false)
          return
        }
      } catch (error: any) {
        // Si 401, token invalide - rediriger
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          return
        }
        // Pour les autres erreurs (réseau), on laisse passer
      }
      
      setIsChecking(false)
    }

    verifyAuth()
  }, [])

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#66E4FF] border-t-transparent mx-auto" />
          <p className="text-white/60">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative">
                <Logo className="h-24 w-24" />
                <span className="absolute inset-0 animate-ping rounded-2xl bg-[#A855F7]/40" />
              </div>
            </Link>
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
      <main className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">{children}</main>
    </div>
  )
}

