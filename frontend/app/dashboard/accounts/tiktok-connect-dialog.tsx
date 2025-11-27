'use client'
// eslint-disable-next-line react/no-unescaped-entities

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, QrCode, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface TikTokConnectDialogProps {
  workspaceId: string
  onSuccess: () => void
}

export function TikTokConnectDialog({ workspaceId, onSuccess }: TikTokConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'scanning' | 'connected' | 'expired' | 'error'>('waiting')
  const [statusMessage, setStatusMessage] = useState('')
  const [cookiesInput, setCookiesInput] = useState('')
  const [useQRCode, setUseQRCode] = useState(true)

  // Polling du statut de connexion QR
  useEffect(() => {
    if (!connectionId || !open) return

    const pollStatus = async () => {
      try {
        const response = await api.get(`/social-accounts/connect/status/tiktok/${connectionId}`)
        const status = response.data

        setConnectionStatus(status.status)
        setStatusMessage(status.username ? `Connecté en tant que @${status.username}` : status.error || '')

        if (status.status === 'connected') {
          // Finaliser la connexion
          try {
            await api.post('/social-accounts/connect/complete', {
              platform: 'tiktok',
              workspaceId,
              connectionId,
            })
            setOpen(false)
            onSuccess()
            alert('✅ Compte TikTok connecté avec succès !')
          } catch (error: any) {
            console.error('Erreur lors de la finalisation:', error)
            alert(`Erreur: ${error.response?.data?.message || error.message}`)
          }
        } else if (status.status === 'expired' || status.status === 'error') {
          setStatusMessage(status.error || 'Connexion expirée. Veuillez réessayer.')
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error)
      }
    }

    // Polling toutes les 3 secondes
    const interval = setInterval(pollStatus, 3000)
    pollStatus() // Premier appel immédiat

    return () => clearInterval(interval)
  }, [connectionId, open, workspaceId, onSuccess])

  // Initier la connexion QR code
  const handleQRConnect = async () => {
    try {
      setIsLoading(true)
      setConnectionStatus('waiting')
      setStatusMessage('Génération du QR code...')

      const response = await api.post('/social-accounts/connect/initiate', {
        platform: 'tiktok',
        workspaceId,
      })

      if (response.data.method === 'qr_code') {
        setConnectionId(response.data.connectionId)
        setQrCodeBase64(response.data.qrCodeBase64)
        setConnectionStatus('scanning')
        setStatusMessage('Scannez le QR code avec l&apos;application TikTok sur votre téléphone')
      } else {
        // Fallback vers cookies si QR code non disponible
        setUseQRCode(false)
        setStatusMessage('QR code non disponible. Utilisez la méthode cookies.')
      }
    } catch (error: any) {
      console.error('Erreur lors de l&apos;initiation:', error)
      setConnectionStatus('error')
      setStatusMessage(error.response?.data?.message || 'Erreur lors de la génération du QR code')
      // Fallback vers cookies
      setUseQRCode(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Connexion via cookies (fallback)
  const handleCookiesConnect = async () => {
    try {
      setIsLoading(true)
      
      // Parser les cookies
      let cookies: string[] = []
      if (cookiesInput.includes('\t')) {
        // Format DevTools (tabulations)
        const lines = cookiesInput.split('\n').filter(line => line.trim())
        for (const line of lines) {
          const parts = line.split('\t')
          if (parts.length >= 2 && parts[0] && parts[1]) {
            cookies.push(`${parts[0].trim()}=${parts[1].trim()}`)
          }
        }
      } else {
        // Format string simple
        cookies = cookiesInput.split('\n').filter(line => line.trim())
      }

      if (cookies.length === 0) {
        alert('Aucun cookie valide trouvé. Veuillez copier les cookies depuis DevTools.')
        return
      }

      await api.post('/social-accounts/connect/complete', {
        platform: 'tiktok',
        workspaceId,
        cookies,
      })

      setOpen(false)
      onSuccess()
      alert('✅ Compte TikTok connecté avec succès !')
    } catch (error: any) {
      console.error(error)
      alert(`Erreur: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Réinitialiser quand le dialog s&apos;ouvre
  useEffect(() => {
    if (open) {
      setConnectionId(null)
      setQrCodeBase64(null)
      setConnectionStatus('waiting')
      setStatusMessage('')
      setCookiesInput('')
      setUseQRCode(true)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full text-white" style={{ backgroundColor: '#FE2C55' }}>
          Connecter TikTok
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" style={{ backgroundColor: '#050914', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
        <DialogHeader>
          <DialogTitle>Connexion TikTok</DialogTitle>
          <DialogDescription>
            Connectez votre compte TikTok via QR code (recommandé) ou cookies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {useQRCode && !qrCodeBase64 && (
            <div className="p-6 rounded-lg text-center" style={{ 
              background: 'linear-gradient(to right, rgba(254, 44, 85, 0.2), rgba(37, 244, 238, 0.2))',
              border: '1px solid rgba(254, 44, 85, 0.3)'
            }}>
              <QrCode className="h-12 w-12 mx-auto mb-4" style={{ color: '#FE2C55' }} />
              <h3 className="font-semibold text-lg mb-2">Connexion via QR Code</h3>
              <p className="mb-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Scannez le QR code avec l&apos;application TikTok sur votre téléphone pour vous connecter instantanément.
              </p>
              <Button
                onClick={handleQRConnect}
                disabled={isLoading}
                className="w-full text-white"
                style={{ backgroundColor: '#FE2C55' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération du QR code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Générer le QR code
                  </>
                )}
              </Button>
            </div>
          )}

          {qrCodeBase64 && (
            <div className="p-6 rounded-lg text-center" style={{ 
              background: 'linear-gradient(to right, rgba(254, 44, 85, 0.2), rgba(37, 244, 238, 0.2))',
              border: '1px solid rgba(254, 44, 85, 0.3)'
            }}>
              <div className="mb-4">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code TikTok"
                  className="mx-auto w-64 h-64 border-4 border-white/20 rounded-lg bg-white p-4"
                />
              </div>
              <div className="space-y-2">
                {connectionStatus === 'scanning' && (
                  <>
                    <div className="flex items-center justify-center gap-2 text-blue-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>En attente du scan...</span>
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Scannez ce QR code avec l&apos;application TikTok sur votre téléphone
                    </p>
                  </>
                )}
                {connectionStatus === 'connected' && (
                  <div className="flex items-center justify-center gap-2" style={{ color: '#4ade80' }}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{statusMessage || 'Connexion réussie !'}</span>
                  </div>
                )}
                {connectionStatus === 'expired' && (
                  <div className="flex items-center justify-center gap-2" style={{ color: '#f87171' }}>
                    <AlertCircle className="h-4 w-4" />
                    <span>QR code expiré. Veuillez réessayer.</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2" style={{ color: '#f87171' }}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{statusMessage || 'Erreur lors de la connexion'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Méthode alternative : Cookies */}
          <details className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <summary className="cursor-pointer text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              💡 Méthode alternative : Copier les cookies manuellement
            </summary>

            <div className="mt-4 space-y-3 text-sm">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#bfdbfe' }}>
                <p className="font-semibold mb-2">📋 Instructions rapides :</p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <li>Ouvrez TikTok.com dans votre navigateur et connectez-vous</li>
                  <li>Appuyez sur <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>F12</kbd> → Onglet &quot;Application&quot; → &quot;Cookies&quot;</li>
                  <li>Capturez depuis <strong>tous</strong> les domaines : tiktok.com, www.tiktok.com, m.tiktok.com</li>
                  <li>Sélectionnez tous les cookies (Ctrl+A) et copiez (Ctrl+C)</li>
                  <li>Collez ci-dessous et cliquez "Valider"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cookies" className="text-xs">Collez les cookies ici :</Label>
                <Textarea
                  id="cookies"
                  placeholder="Collez les cookies depuis DevTools (format tableau avec tabulations)..."
                  className="h-24 font-mono text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                  value={cookiesInput}
                  onChange={(e) => setCookiesInput(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCookiesConnect}
                disabled={isLoading || !cookiesInput.trim()}
                className="w-full text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                size="sm"
              >
                {isLoading ? 'Connexion...' : 'Valider la connexion'}
              </Button>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  )
}
