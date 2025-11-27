'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function TikTokAutoConnectPage() {
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  const [status, setStatus] = useState('Vérification de la connexion...')
  const [hasRedirected, setHasRedirected] = useState(false)
  const [isOnTikTok, setIsOnTikTok] = useState(false)

  // Log au chargement de la page
  useEffect(() => {
    console.log('🚀 [AUTO-CONNECT] Page TikTokAutoConnectPage chargée');
    console.log('🚀 [AUTO-CONNECT] workspaceId:', workspaceId);
    console.log('🚀 [AUTO-CONNECT] window.location:', window.location.href);
  }, [workspaceId])

  useEffect(() => {
    // Vérifier que window existe (côté client uniquement)
    if (typeof window === 'undefined') return;

    if (!workspaceId) {
      setStatus('❌ Workspace ID manquant')
      return
    }

    // Vérifier si on est sur TikTok
    const isOnTikTokDomain = window.location.hostname.includes('tiktok.com');
    setIsOnTikTok(isOnTikTokDomain);

    // Fonction pour récupérer et envoyer les cookies
    const extractAndSendCookies = () => {
      try {
        // Récupérer TOUS les cookies depuis le navigateur
        const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c && c.includes('='));
        
        // Vérifier les cookies TikTok importants (sessionid, sid_tt, etc.)
        const importantCookies = ['sessionid', 'sid_tt', 'sid_guard', 'uid_tt', 'uid_tt_ss', 'sid_ucp_v1', 'sessionid_ss', 'store-id', 'store-country-code'];
        const hasImportantCookies = allCookies.some(cookie => {
          const name = cookie.split('=')[0].trim();
          return importantCookies.some(important => cookie.toLowerCase().includes(important.toLowerCase()));
        });
        
        console.log('🍪 [AUTO-CONNECT] Cookies trouvés:', allCookies.length, 'Cookies importants:', hasImportantCookies);
        
        // Si on a des cookies (même sans les cookies "importants", TikTok peut fonctionner)
        if (allCookies.length > 0) {
          setStatus('✅ Cookies récupérés ! Connexion en cours...');
          console.log('✅ [AUTO-CONNECT] Cookies trouvés, envoi au parent...');
          
          // Si on est sur TikTok, on ne peut pas utiliser postMessage (cross-origin bloqué)
          // On utilise localStorage et on redirige vers notre page
          if (isOnTikTokDomain) {
            console.log('🌐 [AUTO-CONNECT] Sur TikTok, utilisation de localStorage (cross-origin bloqué)');
            console.log('💾 [AUTO-CONNECT] Stockage dans localStorage...');
            localStorage.setItem('tiktok_cookies', JSON.stringify(allCookies));
            localStorage.setItem('tiktok_workspace', workspaceId);
            console.log('✅ [AUTO-CONNECT] Cookies stockés, redirection vers /auth/tiktok/connect...');
            // Rediriger vers notre page qui va lire localStorage
            window.location.href = `http://localhost:3000/auth/tiktok/connect?workspaceId=${workspaceId}&auto=true`;
            return true;
          }
          
          // Si on est sur notre domaine, on peut utiliser postMessage
          // Envoyer les cookies au parent (la page de connexion)
          if (window.opener && !window.opener.closed) {
            console.log('📤 [AUTO-CONNECT] Envoi des cookies au parent via postMessage...');
            console.log('📤 [AUTO-CONNECT] Nombre de cookies:', allCookies.length);
            console.log('📤 [AUTO-CONNECT] Premiers cookies:', allCookies.slice(0, 3));
            console.log('📤 [AUTO-CONNECT] window.opener existe:', !!window.opener);
            console.log('📤 [AUTO-CONNECT] window.opener.closed:', window.opener.closed);
            
            try {
              const message = {
                type: 'TIKTOK_COOKIES',
                cookies: allCookies,
                workspaceId: workspaceId, // Ajouter workspaceId pour vérification
              };
              
              console.log('📤 [AUTO-CONNECT] Message à envoyer:', {
                type: message.type,
                cookiesCount: message.cookies.length,
                workspaceId: message.workspaceId
              });
              
              // Essayer d'envoyer vers l'origine du parent
              const parentOrigin = window.location.origin;
              console.log('📤 [AUTO-CONNECT] Envoi vers origin:', parentOrigin);
              
              window.opener.postMessage(message, parentOrigin);
              
              // Aussi essayer avec '*' au cas où
              window.opener.postMessage(message, '*');
              
              console.log('✅ [AUTO-CONNECT] Message envoyé avec succès (2x: origin et *)');
              
              setTimeout(() => {
                try {
                  window.close();
                  console.log('✅ [AUTO-CONNECT] Fenêtre fermée');
                } catch (e) {
                  console.warn('⚠️ [AUTO-CONNECT] Impossible de fermer la fenêtre:', e);
                }
              }, 1000);
              return true; // Succès
            } catch (error) {
              console.error('❌ [AUTO-CONNECT] Erreur lors de l\'envoi du message:', error);
              // Fallback vers localStorage
              console.log('💾 [AUTO-CONNECT] Fallback: stockage dans localStorage...');
              localStorage.setItem('tiktok_cookies', JSON.stringify(allCookies));
              localStorage.setItem('tiktok_workspace', workspaceId);
              window.location.href = `/auth/tiktok/connect?workspaceId=${workspaceId}&auto=true`;
              return true;
            }
          } else {
            // Si pas de parent, stocker dans localStorage
            console.log('💾 [AUTO-CONNECT] Pas de parent, stockage dans localStorage...');
            localStorage.setItem('tiktok_cookies', JSON.stringify(allCookies));
            localStorage.setItem('tiktok_workspace', workspaceId);
            window.location.href = `/auth/tiktok/connect?workspaceId=${workspaceId}&auto=true`;
            return true; // Succès
          }
        }
        
        return false; // Pas de cookies trouvés
      } catch (error) {
        console.error('❌ Error getting cookies:', error);
        return false;
      }
    };

    // Si on est déjà sur TikTok
    if (isOnTikTokDomain) {
      console.log('🌐 [AUTO-CONNECT] Détecté sur TikTok!');
      setStatus('✅ Sur TikTok... Vérification de la connexion...');
      
      // Essayer immédiatement (au cas où on est déjà connecté)
      let attempts = 0;
      const maxAttempts = 10; // 10 tentatives sur 10 secondes (plus de temps)
      
      const tryExtractCookies = () => {
        attempts++;
        console.log(`🔄 [AUTO-CONNECT] Tentative ${attempts}/${maxAttempts} de récupération des cookies...`);
        
        // Vérifier les cookies disponibles
        const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c && c.includes('='));
        console.log(`🍪 [AUTO-CONNECT] Cookies trouvés dans document.cookie: ${allCookies.length}`);
        
        if (extractAndSendCookies()) {
          // Succès, on a récupéré les cookies
          console.log('✅ [AUTO-CONNECT] Cookies récupérés avec succès!');
          return;
        }
        
        // Si pas de cookies après plusieurs tentatives, rediriger vers login
        if (attempts >= maxAttempts) {
          console.warn('⚠️ [AUTO-CONNECT] Pas de cookies après', maxAttempts, 'tentatives');
          setStatus('⚠️ Pas de session détectée. Redirection vers la connexion...');
          setTimeout(() => {
            window.location.href = 'https://www.tiktok.com/login';
          }, 1000);
        } else {
          // Réessayer dans 1 seconde
          setTimeout(tryExtractCookies, 1000);
        }
      };
      
      // Commencer les tentatives après un court délai pour laisser la page se charger
      console.log('⏰ [AUTO-CONNECT] Démarrage des tentatives dans 2 secondes...');
      setTimeout(tryExtractCookies, 2000);
      
      return;
    }

    // Si on n'est pas encore sur TikTok, rediriger vers TikTok (pas /login pour détecter la session)
    if (!hasRedirected) {
      setHasRedirected(true);
      setStatus('Redirection vers TikTok...');
      console.log('🔄 [AUTO-CONNECT] Redirection vers TikTok dans 500ms...');
      
      setTimeout(() => {
        // Aller sur TikTok directement (pas /login) pour qu'il détecte la session existante
        console.log('🚀 [AUTO-CONNECT] Redirection vers https://www.tiktok.com');
        window.location.href = 'https://www.tiktok.com';
      }, 500);
    }
  }, [workspaceId, hasRedirected])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] p-6">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-8 text-center">
        <div className="mb-4 text-4xl">🔄</div>
        <h2 className="mb-2 text-xl font-bold text-white">Connexion TikTok</h2>
        <p className="text-white/60">{status}</p>
        <p className="mt-4 text-sm text-white/40">
          {isOnTikTok
            ? 'Récupération automatique des cookies...'
            : 'Redirection vers TikTok. Connectez-vous, les cookies seront récupérés automatiquement.'}
        </p>
      </div>
    </div>
  )
}

