'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function MetaCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state') // workspaceId
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('❌ Meta OAuth error:', { error, errorReason, errorDescription })
      setStatus('error')
      setMessage(errorDescription || errorReason || 'Une erreur est survenue lors de la connexion')
      setTimeout(() => router.push('/dashboard/accounts'), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('Code d\'autorisation manquant')
      setTimeout(() => router.push('/dashboard/accounts'), 3000)
      return
    }

    // Appeler le backend pour traiter le callback
    const handleCallback = async () => {
      try {
        console.log('📥 Processing Meta callback:', { code, workspaceId: state })
        const response = await api.get(`/social-accounts/instagram/callback`, {
          params: {
            code,
            workspaceId: state,
          },
        })
        console.log('✅ Meta callback successful:', response.data)
        setStatus('success')
        setMessage('Compte Instagram connecté avec succès!')
        
        // Notifier la page accounts de la connexion
        if (typeof window !== 'undefined') {
          localStorage.setItem('account-connected', Date.now().toString());
          // Déclencher un événement storage pour les autres onglets
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'account-connected',
            newValue: Date.now().toString(),
          }));
        }
        
        setTimeout(() => router.push('/dashboard/accounts'), 2000)
      } catch (err: any) {
        console.error('❌ Meta callback error:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'Erreur lors de la connexion du compte')
        setTimeout(() => router.push('/dashboard/accounts'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#0f1629] to-[#1a1f35]">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/80">Connexion en cours...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-400 text-4xl mb-4">✅</div>
            <p className="text-white text-lg">{message}</p>
            <p className="text-white/60 text-sm">Redirection en cours...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-400 text-4xl mb-4">❌</div>
            <p className="text-white text-lg">{message}</p>
            <p className="text-white/60 text-sm">Redirection en cours...</p>
          </>
        )}
      </div>
    </div>
  )
}

