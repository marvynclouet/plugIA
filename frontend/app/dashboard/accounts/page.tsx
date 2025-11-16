'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Instagram, Linkedin, Music, Twitter } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const platformCards = [
  {
    id: 'instagram',
    name: 'Instagram',
    gradient: 'from-[#F58529] via-[#DD2A7B] to-[#515BD4]',
    icon: Instagram,
    tagline: 'DM + interactions + reels insights',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    gradient: 'from-[#25F4EE] via-[#25F4EE] to-[#FE2C55]',
    icon: Music,
    tagline: 'Auto DM & comments sur trends',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    gradient: 'from-[#0077B5] to-[#00A0DC]',
    icon: Linkedin,
    tagline: 'Social selling + messagerie pro',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    gradient: 'from-[#4B4B4B] to-[#0F0F0F]',
    icon: Twitter,
    tagline: 'Mentions, RT & DM builder',
  },
]

export default function AccountsPage() {
  const [workspaceId, setWorkspaceId] = useState('')

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
  })

  const selectedWorkspaceId = workspaceId || workspaces?.[0]?.id

  const { data: accounts } = useQuery({
    queryKey: ['accounts', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      const res = await api.get(`/social-accounts/workspace/${selectedWorkspaceId}`)
      return res.data
    },
    enabled: !!selectedWorkspaceId,
  })

  const { mutate: getAuthUrl } = useMutation({
    mutationFn: async (platform: string) => {
      const res = await api.get(`/social-accounts/${platform}/auth-url?workspaceId=${selectedWorkspaceId}`)
      return res.data.url
    },
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4">
        <Badge variant="ghost" className="w-fit text-white/60">
          🌍 Multi-plateforme synchronisée
        </Badge>
        <div>
          <h1 className="font-display text-3xl text-white md:text-4xl">Brancher mes réseaux</h1>
          <p className="text-white/60">
            Active l’IA VistaFlow sur chacun de tes playgrounds. Les quotas & DM respectent les règles officielles des APIs.
          </p>
        </div>
        {workspaces && workspaces.length > 0 && (
          <div className="flex flex-wrap gap-3 text-sm">
            <p className="text-white/60">Workspace actif :</p>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none"
            >
              {workspaces.map((ws: any) => (
                <option key={ws.id} value={ws.id} className="bg-[#050914]">
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {platformCards.map((platform) => {
          const account = accounts?.find((acc: any) => acc.platform === platform.id)
          const Icon = platform.icon
          return (
            <Card key={platform.id} className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${platform.gradient}`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{platform.name}</CardTitle>
                    <CardDescription>{platform.tagline}</CardDescription>
                  </div>
                </div>
                {account && (
                  <Badge variant="neon" className="text-xs">
                    Connecté
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {account ? (
                  <>
                    <p className="text-sm text-white/70">
                      @{account.platformUsername} — connecté le{' '}
                      {new Date(account.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-white/50">
                      <span className="rounded-full border border-white/10 px-3 py-1">Scope: {account.scopes.join(', ') || 'N/A'}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Statut : {account.isActive ? 'Actif' : 'En pause'}
                      </span>
                    </div>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => getAuthUrl(platform.id)}>
                    Connecter {platform.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {accounts && accounts.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Comptes synchronisés</CardTitle>
            <CardDescription>Historique et statut temps réel</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-white/40">
                  <th className="pb-3">Plateforme</th>
                  <th className="pb-3">Handle</th>
                  <th className="pb-3">Connecté le</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((account: any) => (
                  <tr key={account.id} className="text-white/80">
                    <td className="py-4 capitalize">{account.platform}</td>
                    <td className="py-4">@{account.platformUsername}</td>
                    <td className="py-4">{new Date(account.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-4">
                      <Badge variant={account.isActive ? 'neon' : 'ghost'}>
                        {account.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

