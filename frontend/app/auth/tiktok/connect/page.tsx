'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TikTokConnectPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] p-6">
      <Card className="w-full max-w-2xl border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white text-2xl">🚀 Nouvelle méthode de connexion</CardTitle>
          <CardDescription className="text-white/70">
            L'extension Chrome détecte automatiquement vos sessions TikTok
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
            <h3 className="font-semibold text-blue-200 mb-3 text-lg">✨ Connexion automatique</h3>
            <p className="text-sm text-blue-200/80 mb-4">
              Plus besoin de copier des cookies ou de scanner un QR code ! L'extension Chrome PlugIA détecte automatiquement quand vous êtes connecté sur TikTok.
            </p>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-white mb-3">📋 Comment ça marche :</h4>
              <ol className="text-sm text-white/80 space-y-2 list-decimal list-inside">
                <li>Installez l'extension Chrome PlugIA depuis le dashboard</li>
                <li>Connectez-vous à PlugIA dans le popup de l'extension</li>
                <li>Allez sur <strong>TikTok.com</strong> et connectez-vous normalement</li>
                <li>Allez sur la page <strong>Notifications</strong></li>
                <li>L'extension détecte automatiquement et capture les interactions ! ✨</li>
              </ol>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-200">
                💡 <strong>Astuce :</strong> L'extension fonctionne en arrière-plan. Aucune configuration supplémentaire nécessaire !
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard/accounts')}
              className="flex-1 bg-gradient-to-r from-[#7C5CFF] to-[#44E2FF] text-white"
            >
              ← Retour au dashboard
            </Button>
            <Button
              onClick={() => router.push('/dashboard/accounts')}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              📥 Installer l'extension
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
