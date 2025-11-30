// Popup script pour l'extension PlugIA

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Éléments DOM
const loginForm = document.getElementById('login-form') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const connectLink = document.getElementById('connect-link') as HTMLAnchorElement;
const accountsList = document.getElementById('accounts-list') as HTMLElement;

// Récupérer le token depuis le site Flow.IA
async function getTokenFromSite(): Promise<string | null> {
  try {
    // Essayer de récupérer le token depuis le localStorage du site Flow.IA
    // On cherche tous les onglets qui pointent vers le site
    const siteUrlPattern = SITE_URL.replace('http://', '').replace('https://', '').split('/')[0];
    const tabs = await chrome.tabs.query({ url: `*://${siteUrlPattern}/*` });
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          // Injecter un script pour récupérer le token
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return localStorage.getItem('token');
            },
          });
          
          if (results && results[0]?.result) {
            return results[0].result;
          }
        } catch (err) {
          // Tab might not be accessible, continue
          continue;
        }
      }
    }
  } catch (err) {
    console.log('Could not get token from site:', err);
  }
  
  return null;
}

// Vérifier l'état de connexion au chargement
async function checkAuthStatus(): Promise<void> {
  // D'abord, essayer de récupérer le token depuis le site
  let token = await getTokenFromSite();
  
  // Si pas trouvé, vérifier dans le storage de l'extension
  if (!token) {
    const { authToken } = await chrome.storage.sync.get(['authToken']);
    token = authToken;
  } else {
    // Sauvegarder le token dans l'extension
    await chrome.storage.sync.set({ authToken: token });
  }

  if (token) {
    // Vérifier si le token est valide
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        await showLoggedIn(user, token);
      } else {
        // Token invalide, supprimer
        await chrome.storage.sync.remove(['authToken']);
        showLoggedOut();
      }
    } catch (err) {
      console.error('Auth check error:', err);
      showLoggedOut();
    }
  } else {
    showLoggedOut();
  }
}

async function showLoggedIn(user: any, token: string): Promise<void> {
  loginForm.style.display = 'none';
  statusDiv.style.display = 'block';
  
  if (statusText) {
    statusText.innerHTML = `
      <p class="text-sm font-semibold text-green-400 mb-2">✓ Connecté à PlugIA</p>
      <p class="text-xs text-gray-300">${user.email || user.name || 'Utilisateur'}</p>
    `;
  }

  // Afficher les instructions simples
  if (accountsList) {
    accountsList.innerHTML = `
      <div class="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/30">
        <p class="text-xs font-semibold text-blue-300 mb-2">🚀 Comment ça marche :</p>
        <ol class="text-xs text-gray-300 space-y-1 list-decimal list-inside">
          <li>Allez sur TikTok, Instagram, Facebook ou Twitter</li>
          <li>Connectez-vous normalement (comme d'habitude)</li>
          <li>Allez sur la page Notifications</li>
          <li>L'extension capture automatiquement ! ✨</li>
        </ol>
      </div>
      <div class="mt-3 p-2 rounded bg-green-500/10 border border-green-500/30">
        <p class="text-xs text-green-300">
          💡 <strong>Astuce :</strong> L'extension détecte automatiquement quand vous êtes connecté sur un réseau social. Aucune configuration supplémentaire nécessaire !
        </p>
      </div>
    `;
  }
}

// Fonction supprimée - plus besoin d'afficher les comptes connectés
// L'extension détecte automatiquement les sessions actives

function showLoggedOut(): void {
  loginForm.style.display = 'none';
  statusDiv.style.display = 'block';
  
  if (statusText) {
    statusText.innerHTML = `
      <p class="text-sm text-gray-300 mb-3">Connectez-vous sur le site Flow.IA pour utiliser l'extension.</p>
      <a href="${SITE_URL}/login" target="_blank" class="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded">
        Aller sur Flow.IA
      </a>
    `;
  }
  
  if (accountsList) {
    accountsList.innerHTML = '';
  }
}

// Vérifier l'état au chargement
checkAuthStatus();

// Rafraîchir toutes les 5 secondes
setInterval(checkAuthStatus, 5000);

