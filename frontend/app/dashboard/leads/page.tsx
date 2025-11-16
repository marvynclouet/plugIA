'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { Download, Filter } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  in_progress: 'En cours',
  converted: 'Converti',
  refused: 'Refusé',
}

const statusClasses: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-200',
  contacted: 'bg-yellow-500/20 text-yellow-200',
  in_progress: 'bg-purple-500/20 text-purple-200',
  converted: 'bg-green-500/20 text-green-200',
  refused: 'bg-red-500/20 text-red-200',
}

export default function LeadsPage() {
  const [workspaceId, setWorkspaceId] = useState('')
  const [filters, setFilters] = useState({ platform: '', status: '', search: '' })

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
  })

  const selectedWorkspaceId = workspaceId || workspaces?.[0]?.id

  const { data: leads, refetch, isFetching } = useQuery({
    queryKey: ['leads', selectedWorkspaceId, filters],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      const params = new URLSearchParams()
      if (filters.platform) params.append('platform', filters.platform)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      const res = await api.get(`/leads/workspace/${selectedWorkspaceId}?${params.toString()}`)
      return res.data
    },
    enabled: !!selectedWorkspaceId,
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/leads/${id}/status?workspaceId=${selectedWorkspaceId}`, { status })
    },
    onSuccess: () => refetch(),
  })

  const { mutate: exportCsv } = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/leads/export/csv/${selectedWorkspaceId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `leads-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.5em] text-white/40">Pipeline</p>
          <h1 className="font-display text-3xl text-white md:text-4xl">Leads IA captés</h1>
          <p className="text-white/60">Chaque interaction chaude devient un lead ultra documenté.</p>
        </div>
        <Button variant="subtle" onClick={() => exportCsv()} className="gap-2">
          <Download className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {workspaces && workspaces.length > 0 && (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-2">
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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Recherche
            </p>
            <Input
              placeholder="Nom, @pseudo, téléphone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Plateforme</p>
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Toutes</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Statut</p>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Tous</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full border border-white/10"
              onClick={() => setFilters({ platform: '', status: '', search: '' })}
            >
              Reset
            </Button>
          </div>
        </div>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Pipeline actif</CardTitle>
            <p className="text-sm text-white/50">
              {isFetching ? 'Mise à jour...' : `${leads?.length || 0} leads enrichis`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-white/40">
                <th className="pb-3">Lead</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Plateforme</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads?.map((lead: any) => (
                <tr key={lead.id} className="text-white/80">
                  <td className="py-4">
                    <p className="font-medium text-white">{lead.name || lead.username}</p>
                    <p className="text-xs text-white/50">@{lead.username}</p>
                  </td>
                  <td className="py-4">
                    <p>{lead.phone || '—'}</p>
                    <p className="text-xs text-white/50">{lead.email || '—'}</p>
                  </td>
                  <td className="py-4 capitalize">{lead.platform || '—'}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#66E4FF] to-[#7C5CFF]"
                          style={{ width: `${Math.min(lead.interestScore || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{lead.interestScore?.toFixed(0) || 0}/100</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus({ id: lead.id, status: e.target.value })}
                      className={cn(
                        'rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none',
                        statusClasses[lead.status] || 'bg-white/10 text-white'
                      )}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value} className="bg-[#050914] text-white">
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 text-white/60">
                    {format(new Date(lead.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                      Voir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!leads || leads.length === 0) && (
            <div className="py-16 text-center">
              <p className="text-white/50">Aucun lead encore capté — lance une séquence DM pour remplir le tableau 🔥</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

