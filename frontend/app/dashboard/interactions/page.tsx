'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { api } from '@/lib/api'
import { 
  Instagram, 
  Linkedin, 
  Music, 
  Twitter, 
  Facebook,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Send,
  Filter,
  Calendar,
  X
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music,
  linkedin: Linkedin,
  twitter: Twitter,
}

const platformColors: Record<string, string> = {
  instagram: 'from-[#F58529] via-[#DD2A7B] to-[#515BD4]',
  facebook: 'from-[#1877F2] to-[#42A5F5]',
  tiktok: 'from-[#25F4EE] to-[#FE2C55]',
  linkedin: 'from-[#0077B5] to-[#00A0DC]',
  twitter: 'from-[#4B4B4B] to-[#0F0F0F]',
}

const typeIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  share: Share2,
  save: Share2,
  dm_received: MessageCircle,
}

const typeLabels: Record<string, string> = {
  like: 'Like',
  comment: 'Commentaire',
  follow: 'Abonnement',
  share: 'Partage',
  save: 'Sauvegarde',
  dm_received: 'Message reçu',
}

const typeColors: Record<string, string> = {
  like: 'bg-red-500/20 text-red-200 border-red-500/30',
  comment: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  follow: 'bg-green-500/20 text-green-200 border-green-500/30',
  share: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  save: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  dm_received: 'bg-pink-500/20 text-pink-200 border-pink-500/30',
}

export default function InteractionsPage() {
  const [workspaceId, setWorkspaceId] = useState('')
  const [filters, setFilters] = useState({
    platform: '',
    type: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
  })

  const selectedWorkspaceId = workspaceId || workspaces?.[0]?.id

  const { data: interactions, refetch, isFetching, error: interactionsError } = useQuery({
    queryKey: ['interactions', selectedWorkspaceId, filters],
    queryFn: async () => {
      if (!selectedWorkspaceId) {
        console.log('⚠️ No workspace selected');
        return []
      }
      console.log('📡 Fetching interactions for workspace:', selectedWorkspaceId);
      const params = new URLSearchParams()
      if (filters.platform) params.append('platform', filters.platform)
      if (filters.type) params.append('type', filters.type)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      try {
        const res = await api.get(`/interactions/workspace/${selectedWorkspaceId}?${params.toString()}`)
        console.log('✅ Interactions fetched:', res.data?.length || 0);
        return res.data || []
      } catch (error: any) {
        console.error('❌ Error fetching interactions:', error);
        throw error;
      }
    },
    enabled: !!selectedWorkspaceId,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  // Récupérer les personnes intéressées
  const { data: interestedUsers } = useQuery({
    queryKey: ['interested-users', selectedWorkspaceId, filters.platform],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      try {
        const params = new URLSearchParams()
        if (filters.platform) params.append('platform', filters.platform)
        const res = await api.get(`/targets/interested/${selectedWorkspaceId}?${params.toString()}`)
        return res.data || []
      } catch (error: any) {
        console.error('❌ Error fetching interested users:', error);
        return []
      }
    },
    enabled: !!selectedWorkspaceId,
    refetchInterval: 30000,
  })

  const clearFilters = () => {
    setFilters({
      platform: '',
      type: '',
      startDate: '',
      endDate: '',
    })
  }

  // Mutation pour forcer la collecte des interactions
  const { mutate: collectInteractions, isPending: isCollecting } = useMutation({
    mutationFn: async (accountId: string) => {
      console.log('🔄 Forcing interaction collection for account:', accountId);
      const res = await api.post(`/interactions/collect/${accountId}`);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('✅ Interactions collected:', data);
      refetch();
      alert(`✅ ${data.created || 0} nouvelles interactions collectées !`);
    },
    onError: (error: any) => {
      console.error('❌ Error collecting interactions:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    },
  })

  // Récupérer les comptes sociaux pour le bouton de collecte
  const { data: socialAccounts } = useQuery({
    queryKey: ['social-accounts', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      const res = await api.get(`/social-accounts/workspace/${selectedWorkspaceId}`)
      return res.data || []
    },
    enabled: !!selectedWorkspaceId,
  })

  const hasActiveFilters = filters.platform || filters.type || filters.startDate || filters.endDate

  // Statistiques
  const stats = {
    total: interactions?.length || 0,
    byPlatform: interactions?.reduce((acc: any, i: any) => {
      acc[i.platform] = (acc[i.platform] || 0) + 1
      return acc
    }, {}) || {},
    byType: interactions?.reduce((acc: any, i: any) => {
      acc[i.type] = (acc[i.type] || 0) + 1
      return acc
    }, {}) || {},
    messagesSent: interactions?.filter((i: any) => i.messageSent).length || 0,
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interactions</h1>
          <p className="mt-2 text-white/60">
            Toutes les interactions de vos réseaux sociaux
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (!selectedWorkspaceId) {
                alert('Veuillez sélectionner un workspace');
                return;
              }
              if (!socialAccounts || socialAccounts.length === 0) {
                alert('Aucun compte social connecté. Connectez d\'abord un compte sur la page Accounts.');
                return;
              }
              const account = socialAccounts[0];
              if (account) {
                console.log('🔄 [FRONTEND] Manual collection triggered for account:', account.id);
                collectInteractions(account.id);
              } else {
                alert('Aucun compte social trouvé');
              }
            }}
            disabled={isCollecting || !selectedWorkspaceId}
            className="flex items-center gap-2 bg-[#66E4FF] text-[#050914] hover:bg-[#66E4FF]/80 disabled:opacity-50"
          >
            {isCollecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#050914] border-t-transparent" />
                Collecte en cours...
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                🔄 Collecter maintenant
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <Badge className="ml-1 bg-[#66E4FF] text-[#050914]">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {workspaces && workspaces.length > 1 && (
            <select
              value={workspaceId || workspaces[0]?.id}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
            >
              {workspaces.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Filtres</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Réseau social
                </label>
                <select
                  value={filters.platform}
                  onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  <option value="">Tous</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Type d'interaction
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  <option value="">Tous</option>
                  <option value="like">Like</option>
                  <option value="comment">Commentaire</option>
                  <option value="follow">Abonnement</option>
                  <option value="share">Partage</option>
                  <option value="save">Sauvegarde</option>
                  <option value="dm_received">Message reçu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-sm text-white/60 mt-1">Total interactions</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{stats.messagesSent}</div>
            <p className="text-sm text-white/60 mt-1">Messages envoyés</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">
              {Object.keys(stats.byPlatform).length}
            </div>
            <p className="text-sm text-white/60 mt-1">Réseaux actifs</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">
              {Object.keys(stats.byType).length}
            </div>
            <p className="text-sm text-white/60 mt-1">Types d'interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Section "Personnes intéressées" */}
      {interestedUsers && interestedUsers.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Personnes intéressées
            </CardTitle>
            <CardDescription className="text-white/70">
              {interestedUsers.length} personne{interestedUsers.length > 1 ? 's' : ''} avec un score d'intérêt élevé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interestedUsers.map((user: any) => {
                const PlatformIcon = platformIcons[user.platform] || MessageCircle
                const scoreColor = user.interestScore >= 50 ? 'text-green-400' : user.interestScore >= 30 ? 'text-yellow-400' : 'text-blue-400'
                
                return (
                  <div
                    key={user.id}
                    className="flex items-start gap-4 rounded-lg border border-green-500/20 bg-white/5 p-4"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${platformColors[user.platform] || 'from-gray-500 to-gray-700'}`}>
                      <PlatformIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">@{user.username}</span>
                          <Badge className={`${scoreColor} border-current bg-transparent text-xs font-semibold`}>
                            Score: {Math.round(user.interestScore)}/100
                          </Badge>
                        </div>
                        <span className="text-xs text-white/50">
                          {user.lastInteractionAt 
                            ? format(new Date(user.lastInteractionAt), 'dd MMM yyyy', { locale: fr })
                            : 'Jamais'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{user.totalInteractions} interaction{user.totalInteractions > 1 ? 's' : ''}</span>
                        {user.recentInteractions && user.recentInteractions.length > 0 && (
                          <>
                            <span className="text-white/40">•</span>
                            <span>
                              Dernière: {user.recentInteractions[0].type === 'like' ? '❤️' : 
                                        user.recentInteractions[0].type === 'comment' ? '💬' :
                                        user.recentInteractions[0].type === 'follow' ? '👤' :
                                        user.recentInteractions[0].type === 'share' ? '📤' : '📌'}
                            </span>
                          </>
                        )}
                      </div>
                      {user.recentInteractions && user.recentInteractions.length > 0 && user.recentInteractions[0].message && (
                        <p className="text-sm text-white/70 italic">
                          "{user.recentInteractions[0].message.substring(0, 100)}..."
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des interactions */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Liste des interactions</CardTitle>
        </CardHeader>
        <CardContent>
          {interactionsError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              <p className="font-semibold">Erreur lors du chargement des interactions</p>
              <p className="text-sm text-red-200/70">
                {interactionsError instanceof Error ? interactionsError.message : 'Une erreur est survenue'}
              </p>
            </div>
          )}
          {isFetching && !interactions ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#66E4FF] border-t-transparent" />
              <p className="ml-3 text-white/60">Chargement des interactions...</p>
            </div>
          ) : interactions && interactions.length > 0 ? (
            <div className="space-y-3">
              {interactions.map((interaction: any) => {
                const PlatformIcon = platformIcons[interaction.platform] || Share2
                const TypeIcon = typeIcons[interaction.type] || MessageCircle
                const platformColor = platformColors[interaction.platform] || 'from-gray-500 to-gray-700'

                return (
                  <div
                    key={interaction.id}
                    className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                  >
                    {/* Icône plateforme */}
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br",
                      platformColor
                    )}>
                      <PlatformIcon className="h-6 w-6 text-white" />
                    </div>

                    {/* Informations principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {interaction.actorUsername}
                        </span>
                        {interaction.actorName && (
                          <span className="text-white/60 text-sm">
                            ({interaction.actorName})
                          </span>
                        )}
                        <Badge className={cn("text-xs", typeColors[interaction.type])}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeLabels[interaction.type] || interaction.type}
                        </Badge>
                      </div>
                      {interaction.message && (
                        <p className="text-sm text-white/70 mb-1 line-clamp-2">
                          {interaction.message}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span>
                          {format(new Date(interaction.createdAt), 'PPp', { locale: fr })}
                        </span>
                        {interaction.contentUrl && (
                          <a
                            href={interaction.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/70 underline"
                          >
                            Voir le contenu
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Statut message envoyé */}
                    <div className="flex items-center gap-2">
                      {interaction.messageSent ? (
                        <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
                          <Send className="h-3 w-3 mr-1" />
                          Message envoyé
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-200 border-gray-500/30">
                          Aucun message
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">Aucune interaction trouvée</p>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

