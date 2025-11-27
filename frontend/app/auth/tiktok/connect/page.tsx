'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TikTokConnectPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const workspaceId = searchParams.get('workspaceId')
  const [step, setStep] = useState<'instructions' | 'connecting' | 'success' | 'error'>('instructions')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [cookiesInput, setCookiesInput] = useState('')

  const parseCookiesFromInput = (input: string): string[] => {
    // Format DevTools (tabulations)
    if (input.includes('\t')) {
      const lines = input.split('\n').filter(line => line.trim())
      const cookies: string[] = []
      for (const line of lines) {
        const parts = line.split('\t')
        if (parts.length >= 2 && parts[0] && parts[1]) {
          cookies.push(`${parts[0].trim()}=${parts[1].trim()}`)
        }
      }
      return cookies
    }
    
    // Format string (name=value; name2=value2)
    if (input.includes('=') && input.includes(';')) {
      return input.split(';').map(c => c.trim()).filter(c => c.includes('='))
    }
    
    // Format JSON
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return parsed.map((c: any) => {
          if (typeof c === 'string') return c
          if (c.name && c.value) return `${c.name}=${c.value}`
          return null
        }).filter(Boolean)
      }
    } catch {}
    
    throw new Error('Format de cookies non reconnu. Utilisez DevTools (F12 → Application → Cookies)')
  }

  const handleCookiesSubmit = async (cookies: string) => {
    if (!workspaceId) {
      setError('Workspace ID manquant')
      return
    }

    try {
      setError('')
      setStatus('Connexion en cours...')
      
      const cookieArray = parseCookiesFromInput(cookies)
      
      if (!cookieArray || cookieArray.length === 0) {
        setError('Aucun cookie valide trouvé.')
        setStep('error')
        return
      }

      const response = await api.post('/social-accounts/tiktok/capture-cookies', {
        workspaceId,
        cookies: cookieArray,
      })

      setStep('success')
      setStatus('✅ Connexion réussie !')
      
      setTimeout(() => {
        router.push('/dashboard/accounts')
      }, 2000)
            } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la connexion'
                setError(errorMessage)
      setStep('error')
      
      // Si c'est une erreur de cookies manquants, afficher des instructions supplémentaires
      if (errorMessage.includes('msToken') || errorMessage.includes('manquant')) {
        setStatus('⚠️ Cookies essentiels manquants. Vérifiez les instructions ci-dessus.')
      }
    }
  }

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050914] p-6">
        <Card className="w-full max-w-md border-white/10 bg-white/5">
          <CardContent className="p-8 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="mb-2 text-2xl font-bold text-white">TikTok connecté !</h2>
            <p className="text-white/60">L'agent IA démarre automatiquement...</p>
            <p className="mt-2 text-sm text-white/40">Redirection en cours...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] p-6">
      <Card className="w-full max-w-2xl border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Connexion TikTok</CardTitle>
          <CardDescription className="text-white/60">
            Copiez vos cookies depuis TikTok en 3 étapes simples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm space-y-2">
              <div className="font-semibold">❌ {error}</div>
              {(error.includes('msToken') || error.includes('manquant')) && (
                <div className="mt-3 pt-3 border-t border-red-500/30">
                  <p className="text-xs text-red-300/80 mb-2">💡 <strong>Solution rapide :</strong></p>
                  <ol className="list-decimal list-inside text-xs text-red-200/70 space-y-1 ml-2">
                    <li>Ouvrez TikTok.com dans un autre onglet</li>
                    <li>F12 → Application → Cookies</li>
                    <li>Cliquez sur <code className="bg-black/30 px-1 rounded">https://tiktok.com</code> → Ctrl+A → Ctrl+C</li>
                    <li>Cliquez sur <code className="bg-black/30 px-1 rounded">https://www.tiktok.com</code> → Ctrl+A → Ctrl+C</li>
                    <li>Cliquez sur <code className="bg-black/30 px-1 rounded">https://m.tiktok.com</code> → Ctrl+A → Ctrl+C</li>
                    <li>Collez TOUS les cookies (des 3 domaines) dans le champ ci-dessous</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Instructions ultra-simples */}
          <div className="bg-gradient-to-r from-[#FE2C55]/20 to-[#25F4EE]/20 border border-[#FE2C55]/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-white">📋 Instructions importantes :</h3>
            <div className="bg-red-500/20 border border-red-500/30 p-3 rounded mb-4">
              <p className="text-red-200 text-sm font-semibold mb-2">⚠️ CRITIQUE : Capturez depuis TOUS les domaines</p>
              <p className="text-white/80 text-xs">
                Le cookie <code className="bg-black/30 px-1 rounded">msToken</code> est essentiel et peut être sur différents domaines.
                Capturez les cookies depuis <strong>tous</strong> les domaines TikTok listés ci-dessous.
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-3 text-white/80">
              <li>
                <strong>Ouvrez TikTok.com</strong> dans un autre onglet et connectez-vous
              </li>
              <li>
                <strong>Appuyez sur F12</strong> → Onglet <strong>"Application"</strong> → <strong>"Cookies"</strong>
              </li>
              <li>
                <strong>Capturez les cookies depuis TOUS ces domaines :</strong>
                <ul className="list-disc list-inside ml-6 mt-2 text-sm text-white/70">
                  <li><code className="bg-black/30 px-1 rounded">https://tiktok.com</code></li>
                  <li><code className="bg-black/30 px-1 rounded">https://www.tiktok.com</code></li>
                  <li><code className="bg-black/30 px-1 rounded">https://m.tiktok.com</code></li>
                </ul>
              </li>
              <li>
                Pour chaque domaine : <strong>Sélectionnez TOUT</strong> (Ctrl+A) → <strong>Copiez</strong> (Ctrl+C)
              </li>
              <li>
                <strong>Collez TOUS les cookies</strong> (des 3 domaines) dans le champ ci-dessous
              </li>
            </ol>
            <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded mt-4">
              <p className="text-yellow-200 text-xs font-semibold mb-1">💡 Astuce :</p>
              <p className="text-white/70 text-xs">
                Si vous ne voyez pas <code className="bg-black/30 px-1 rounded">msToken</code> dans les cookies, 
                c'est qu'il est sur un autre domaine. Vérifiez bien les 3 domaines listés ci-dessus.
              </p>
                </div>
              </div>

          {/* Champ de saisie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Collez vos cookies ici (depuis DevTools) :
            </label>
                  <textarea
              value={cookiesInput}
              onChange={(e) => setCookiesInput(e.target.value)}
              placeholder="Collez les cookies copiés depuis DevTools (format tableau avec tabulations)..."
              className="w-full h-32 p-4 bg-black/30 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-[#FE2C55] focus:outline-none"
                    onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                if (pasted.includes('=') || pasted.includes('\t')) {
                        setTimeout(() => {
                    if (cookiesInput || pasted) {
                      handleCookiesSubmit(pasted || cookiesInput)
                          }
                  }, 300)
                      }
                    }}
                  />
            <p className="text-xs text-white/50">
              💡 Collez directement depuis DevTools (le tableau complet avec toutes les colonnes)
            </p>
              </div>
              
          {/* Bouton */}
                  <Button
                    onClick={() => {
              if (cookiesInput.trim()) {
                handleCookiesSubmit(cookiesInput)
                      } else {
                setError('Veuillez coller les cookies dans le champ ci-dessus')
                      }
                    }}
            disabled={!cookiesInput.trim()}
            className="w-full bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white text-lg py-6"
            size="lg"
                  >
            ✅ Connecter TikTok
                  </Button>

          {/* Aide visuelle */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs text-white/60">
            <p className="font-semibold mb-2 text-white/80">💡 Astuce :</p>
            <p>
              Si vous ne voyez pas l'onglet "Application", cherchez "Storage" ou "Stockage" dans les DevTools.
              L'important est de copier <strong>tout le tableau</strong> des cookies (pas juste quelques valeurs).
            </p>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
