'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SiGooglesheets, SiNotion, SiZapier } from 'react-icons/si'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const integrationTypes = [
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Sync auto de chaque lead, phone & statut → sheets partagés.',
    icon: SiGooglesheets,
    gradient: 'from-[#0F9D58] to-[#34A853]',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Crée des pages et vues intégrées pour ton pipeline social.',
    icon: SiNotion,
    gradient: 'from-[#262626] to-[#050505]',
  },
  {
    id: 'webhook',
    name: 'Webhook / Zapier',
    description: 'Envoie vers Zapier, Make, Airtable ou n’importe quelle API.',
    icon: SiZapier,
    gradient: 'from-[#FF8C1A] to-[#FF5C00]',
  },
]

export default function IntegrationsPage() {
  const [workspaceId, setWorkspaceId] = useState('')

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
  })

  const selectedWorkspaceId = workspaceId || workspaces?.[0]?.id

  const { data: integrations } = useQuery({
    queryKey: ['integrations', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      const res = await api.get(`/integrations/workspace/${selectedWorkspaceId}`)
      return res.data
    },
    enabled: !!selectedWorkspaceId,
  })

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.5em] text-white/40">Ecosystem</p>
        <h1 className="font-display text-3xl text-white md:text-4xl">Synchroniser mes leads partout</h1>
        <p className="text-white/60">
          Push instantané dans tes feuilles de vente, ton CRM Notion ou ton automation favorite.
        </p>
      </div>

      {workspaces && workspaces.length > 0 && (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Workspace</p>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none"
            >
              {workspaces.map((ws: any) => (
                <option key={ws.id} value={ws.id} className="bg-[#050914]">
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
          <p className="md:col-span-2 text-sm text-white/60">
            Configure tes intégrations ici. Chaque lead mis à jour dans VistaFlow déclenche automatiquement un push
            vers tes outils branchés. Tu contrôles l’auto-sync par workspace.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {integrationTypes.map((type) => {
          const integration = integrations?.find((int: any) => int.type === type.id)
          const Icon = type.icon
          return (
            <Card key={type.id} className="border-white/10 bg-white/5">
              <CardHeader className="space-y-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${type.gradient}`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {integration ? (
                  <div className="space-y-3 text-sm text-white/70">
                    <Badge variant="neon" className="text-xs">
                      Connecté
                    </Badge>
                    <p>Nom : {integration.name}</p>
                    <p>Auto-sync : {integration.autoSync ? 'Activé' : 'Manuel'}</p>
                  </div>
                ) : (
                  <Button className="w-full">Configurer</Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {integrations && integrations.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Intégrations actives</CardTitle>
            <CardDescription>Veille sur les pushes envoyés à chaque update</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration: any) => (
              <div key={integration.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
                <div>
                  <p className="font-medium text-white">{integration.name}</p>
                  <p className="text-sm text-white/50">{integration.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  {integration.autoSync && <Badge variant="ghost">Auto-sync</Badge>}
                  <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-100">
                    Déconnecter
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

