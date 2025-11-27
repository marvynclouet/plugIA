'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Instagram, Linkedin, Music, Twitter, Facebook } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TikTokConnectDialog } from './tiktok-connect-dialog'

const platformCards = [
  {
    id: 'instagram',
    name: 'Instagram',
    gradient: 'from-[#F58529] via-[#DD2A7B] to-[#515BD4]',
    icon: Instagram,
    tagline: 'DM + interactions + reels insights',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    gradient: 'from-[#1877F2] to-[#42A5F5]',
    icon: Facebook,
    tagline: 'Pages + Messenger + posts engagement',
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

  const { data: accounts, refetch: refetchAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return []
      console.log('🔄 [ACCOUNTS] Fetching accounts for workspace:', selectedWorkspaceId);
      const res = await api.get(`/social-accounts/workspace/${selectedWorkspaceId}`)
      console.log('✅ [ACCOUNTS] Accounts fetched:', res.data?.length || 0, 'accounts');
      return res.data || []
    },
    enabled: !!selectedWorkspaceId,
    refetchInterval: 3000, // Rafraîchir toutes les 3 secondes pour voir les nouvelles connexions
    refetchOnWindowFocus: true, // Rafraîchir quand on revient sur la page
    refetchOnMount: true, // Rafraîchir à chaque montage
  })

  // Écouter les événements de connexion réussie
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'account-connected' || e.key === 'tiktok-connected') {
        console.log('🔄 [ACCOUNTS] Account connection detected in storage, refetching...');
        setTimeout(() => refetchAccounts(), 500);
      }
    };
    
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'ACCOUNT_CONNECTED' || e.data?.type === 'TIKTOK_CONNECTED') {
        console.log('🔄 [ACCOUNTS] Account connection message received, refetching...');
        setTimeout(() => refetchAccounts(), 500);
      }
    };

    // Vérifier localStorage au montage (pour les redirections)
    const checkConnection = () => {
      const accountConnected = localStorage.getItem('account-connected');
      const tiktokConnected = localStorage.getItem('tiktok-connected');
      if (accountConnected || tiktokConnected) {
        console.log('🔄 [ACCOUNTS] Connection detected in localStorage, refetching...');
        setTimeout(() => refetchAccounts(), 500);
        // Nettoyer après utilisation
        localStorage.removeItem('account-connected');
        localStorage.removeItem('tiktok-connected');
      }
    };

    checkConnection();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    };
  }, [refetchAccounts])

  const { mutate: getAuthUrl, isPending: isConnecting } = useMutation({
    mutationFn: async (platform: string) => {
      if (!selectedWorkspaceId) {
        throw new Error('Aucun workspace sélectionné. Veuillez sélectionner un workspace avant de connecter un compte.')
      }
      
              // Pour TikTok, rediriger vers la page de connexion
              if (platform === 'tiktok') {
                console.log('🍪 [ACCOUNTS] Redirecting to TikTok connection page for workspace:', selectedWorkspaceId)
                // Rediriger directement dans le même onglet (plus fiable que window.open)
                window.location.href = `/auth/tiktok/connect?workspaceId=${selectedWorkspaceId}`
                return { redirected: true }
              }
      
      // Pour les autres plateformes, utiliser OAuth normal
      console.log('🔗 Requesting auth URL for platform:', platform, { workspaceId: selectedWorkspaceId })
      const res = await api.get(`/social-accounts/${platform}/auth-url?workspaceId=${selectedWorkspaceId}`)
      console.log('✅ Auth URL received:', res.data)
      return res.data.url
    },
    onSuccess: (data, platform) => {
      if (platform === 'tiktok') {
        // Pour TikTok, la redirection a déjà été effectuée
        console.log('✅ Redirected to TikTok connection page')
        // Ne rien faire, la redirection a déjà eu lieu
        return
      }
      // Pour les autres plateformes, rediriger vers OAuth
      console.log('🚀 Redirecting to:', data)
      if (data) {
        window.location.href = data
      } else {
        console.error('❌ No URL received')
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la connexion. Veuillez réessayer.'
      alert(errorMessage)
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
            Active l'IA Flow IA sur chacun de tes playgrounds. Les quotas & DM respectent les règles officielles des APIs.
          </p>
        </div>
        {workspaces && workspaces.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <p className="text-white/60">Workspace actif :</p>
            <select
              value={selectedWorkspaceId || ''}
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
        ) : (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
            ⚠️ Aucun workspace trouvé. Veuillez créer un workspace d'abord.
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {platformCards.map((platform) => {
          const account = accounts?.find((acc: any) => acc.platform === platform.id)
          const Icon = platform.icon
          return (
            <Card key={platform.id} className={`border-white/10 bg-white/5 ${account ? 'ring-2 ring-green-500/30' : ''}`}>
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
                {account ? (
                  <Badge className="bg-green-500/20 text-green-200 border-green-500/30 text-xs font-semibold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-white/40 border-white/10">
                    Non connecté
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {account ? (
                  <>
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 mb-3">
                      <p className="text-sm font-semibold text-green-200 flex items-center gap-2">
                        <span>✅</span>
                        Compte connecté
                      </p>
                      <p className="text-xs text-green-200/70 mt-1">
                        @{account.platformUsername} — connecté le {new Date(account.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {account.scopes?.some((s: string) => s.includes('sb-example') || s.includes('example')) && (
                        <div className="mt-2 rounded border border-yellow-500/30 bg-yellow-500/10 p-2">
                          <p className="text-xs text-yellow-200">
                            ⚠️ Cookies invalides détectés. Veuillez vous reconnecter pour obtenir de vrais cookies TikTok.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-white/50">
                      <span className="rounded-full border border-white/10 px-3 py-1">Scope: {account.scopes.join(', ') || 'N/A'}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Statut : {account.isActive ? 'Actif' : 'En pause'}
                      </span>
                    </div>
                    {platform.id === 'tiktok' && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            try {
                              console.log('🔄 [ACCOUNTS] Triggering interaction collection for account:', account.id);
                              const res = await api.post(`/interactions/collect/${account.id}`)
                              console.log('✅ [ACCOUNTS] Collection result:', res.data);
                              alert(`✅ ${res.data.created || 0} nouvelles interactions collectées !\n${res.data.collected || 0} interactions trouvées au total.`)
                            } catch (error: any) {
                              console.error('❌ [ACCOUNTS] Collection error:', error);
                              alert(`❌ Erreur: ${error.response?.data?.message || error.message || 'Erreur lors de la collecte'}`)
                            }
                          }}
                        >
                          🔍 Collecter les interactions maintenant
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            try {
                              const res = await api.get(`/social-accounts/tiktok/monitoring-status?accountId=${account.id}`)
                              alert(`Monitoring: ${res.data.isMonitoring ? '✅ Actif' : '❌ Inactif'}`)
                            } catch (error: any) {
                              alert(error.response?.data?.message || error.message || 'Erreur')
                            }
                          }}
                        >
                          📊 Vérifier le monitoring
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            if (!confirm(`Mettre à jour le nom d'utilisateur TikTok ?\n\nUsername actuel : @${account.platformUsername}\n\nCela va extraire votre vrai username depuis votre compte TikTok.`)) {
                              return
                            }
                            try {
                              console.log('🔄 [ACCOUNTS] Updating TikTok username for account:', account.id);
                              const res = await api.post('/social-accounts/tiktok/update-username', {
                                accountId: account.id,
                                workspaceId: selectedWorkspaceId
                              })
                              if (res.data.success) {
                                alert(`✅ Username mis à jour : @${res.data.username}`)
                                refetchAccounts()
                              } else {
                                alert(`⚠️ Impossible de mettre à jour le username. Le username actuel reste : @${res.data.username}`)
                              }
                            } catch (error: any) {
                              console.error('❌ [ACCOUNTS] Update username error:', error);
                              alert(`❌ Erreur: ${error.response?.data?.message || error.message || 'Erreur lors de la mise à jour'}`)
                            }
                          }}
                        >
                          🔄 Mettre à jour le username
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-2"
                      onClick={async () => {
                        if (!confirm(`Êtes-vous sûr de vouloir déconnecter votre compte ${platform.name} ?\n\nLe monitoring sera arrêté et le compte sera désactivé.`)) {
                          return
                        }
                        try {
                          console.log('🔌 [ACCOUNTS] Disconnecting account:', account.id);
                          await api.delete(`/social-accounts/${account.id}?workspaceId=${selectedWorkspaceId}`)
                          console.log('✅ [ACCOUNTS] Account disconnected');
                          alert(`✅ Compte ${platform.name} déconnecté avec succès !`)
                          refetchAccounts()
                        } catch (error: any) {
                          console.error('❌ [ACCOUNTS] Disconnect error:', error);
                          alert(`❌ Erreur: ${error.response?.data?.message || error.message || 'Erreur lors de la déconnexion'}`)
                        }
                      }}
                    >
                      🔌 Déconnecter
                    </Button>
                  </>
                ) : (
                  platform.id === 'tiktok' ? (
                    <TikTokConnectDialog 
                      workspaceId={selectedWorkspaceId} 
                      onSuccess={() => refetchAccounts()}
                    />
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        if (!selectedWorkspaceId) {
                          alert('Veuillez sélectionner un workspace avant de connecter un compte.')
                          return
                        }
                        console.log('🖱️ Button clicked for platform:', platform.id, { workspaceId: selectedWorkspaceId })
                        getAuthUrl(platform.id)
                      }}
                      disabled={isConnecting || !selectedWorkspaceId}
                    >
                      {isConnecting ? 'Connexion...' : !selectedWorkspaceId ? 'Sélectionnez un workspace' : `Connecter ${platform.name}`}
                    </Button>
                  )
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

