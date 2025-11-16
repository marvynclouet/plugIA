'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Activity, HeartHandshake, MessageCircle } from 'lucide-react'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const quickActions = [
  {
    title: 'Connecter un nouveau réseau',
    description: 'Instagram, TikTok, LinkedIn, X ou même Gmail bientôt.',
    href: '/dashboard/accounts',
    accent: 'from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    emoji: '🌐',
  },
  {
    title: 'Piloter mes leads chauds',
    description: 'Filtrer, taguer et router les prospects captés automatiquement.',
    href: '/dashboard/leads',
    accent: 'from-[#66E4FF] to-[#7C5CFF]',
    emoji: '🔥',
  },
]

export default function DashboardPage() {
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
  })

  const workspaceId = workspaces?.[0]?.id

  const { data: stats } = useQuery({
    queryKey: ['stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null
      const [accounts, leads, interactions] = await Promise.all([
        api.get(`/social-accounts/workspace/${workspaceId}`),
        api.get(`/leads/workspace/${workspaceId}?limit=1`),
        api.get(`/interactions/workspace/${workspaceId}?limit=1`),
      ])
      return {
        accounts: accounts.data.length,
        leads: leads.data.length,
        interactions: interactions.data.length,
      }
    },
    enabled: !!workspaceId,
  })

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#101830] via-[#0B1224] to-[#070A16] px-8 py-10 shadow-[0_40px_120px_rgba(4,7,18,0.65)]">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <Badge variant="ghost" className="w-fit text-white/60">
              Mode Boss activé ⚡️
            </Badge>
            <div className="space-y-4">
              <h1 className="font-display text-4xl text-white md:text-5xl">
                Pulse board —{' '}
                <span className="text-transparent bg-gradient-to-r from-[#66E4FF] to-[#7C5CFF] bg-clip-text">
                  {workspaces?.[0]?.name || 'Workspace'} crew
                </span>
              </h1>
              <p className="text-lg text-white/70">
                Suis l’énergie de ton audience, déclenche des conversations IA ultra humaines et convertis en moins
                de 3 messages. Tout est orchestré depuis ici.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/accounts">Connecter un réseau</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/leads">Voir les leads 🔥</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-white/5 p-4 text-white">
              <CardHeader className="space-y-1 px-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Comptes
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.accounts ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="flex items-center text-sm text-white/60">
                  <Activity className="mr-2 h-4 w-4 text-[#66E4FF]" /> multi-plateformes
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 p-4 text-white">
              <CardHeader className="space-y-1 px-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Leads
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.leads ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="flex items-center text-sm text-white/60">
                  <HeartHandshake className="mr-2 h-4 w-4 text-[#7C5CFF]" /> conversations IA
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 p-4 text-white">
              <CardHeader className="space-y-1 px-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Touches
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.interactions ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="flex items-center text-sm text-white/60">
                  <MessageCircle className="mr-2 h-4 w-4 text-[#F973D3]" /> derniers 24h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.5em] text-white/40">Playbook</p>
            <h2 className="font-display text-2xl text-white">Actions rapides</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30"
            >
              <div
                className={`absolute inset-y-0 right-0 w-1/3 opacity-30 blur-3xl bg-gradient-to-br ${action.accent}`}
              />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <Badge variant="ghost" className="text-white/60">
                    {action.emoji} Recommandé
                  </Badge>
                  <h3 className="font-display text-xl text-white">{action.title}</h3>
                  <p className="text-sm text-white/60">{action.description}</p>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 group-hover:bg-white/20">
                  Go →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

