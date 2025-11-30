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
    statusText.textContent = `Connecté en tant que ${user.email || user.name || 'Utilisateur'}`;
  }

  // Récupérer les comptes sociaux connectés
  try {
    // Récupérer le workspace d'abord
    const workspacesResponse = await fetch(`${API_URL}/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (workspacesResponse.ok) {
      const workspaces = await workspacesResponse.json();
      if (workspaces.length > 0) {
        const workspaceId = workspaces[0].id;
        
        // Récupérer les comptes du workspace
        const accountsResponse = await fetch(`${API_URL}/social-accounts/workspace/${workspaceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (accountsResponse.ok) {
          const accounts = await accountsResponse.json();
          displayAccounts(accounts);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching accounts:', err);
  }
}

function displayAccounts(accounts: any[]): void {
  if (!accountsList) return;
  
  if (accounts.length === 0) {
    accountsList.innerHTML = '<p class="text-sm text-gray-400 mt-2">Aucun compte connecté. Connectez-vous sur le site Flow.IA.</p>';
    return;
  }

  const platformIcons: Record<string, string> = {
    tiktok: '🎵',
    instagram: '📷',
    facebook: '👍',
    twitter: '🐦',
  };

  accountsList.innerHTML = accounts.map((account: any) => `
    <div class="flex items-center gap-2 p-2 rounded bg-white/5">
      <span class="text-lg">${platformIcons[account.platform] || '🔗'}</span>
      <div class="flex-1">
        <p class="text-sm font-medium text-white">@${account.platformUsername}</p>
        <p class="text-xs text-gray-400">${account.platform}</p>
      </div>
      ${account.isActive ? '<span class="text-xs text-green-400">✓</span>' : '<span class="text-xs text-gray-400">⏸</span>'}
    </div>
  `).join('');
}

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

