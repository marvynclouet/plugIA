// Popup script pour l'extension PlugIA

// Note: process.env n'existe pas dans le navigateur
const API_URL = 'http://localhost:3001'; // TODO: Changer en production
const SITE_URL = 'http://localhost:3000'; // TODO: Changer en production

// Éléments DOM
const loginForm = document.getElementById('login-form') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const connectLink = document.getElementById('connect-link') as HTMLAnchorElement;
const accountsList = document.getElementById('accounts-list') as HTMLElement;

// Récupérer le token depuis le site Flow.IA
async function getTokenFromSite(): Promise<string | null> {
  try {
    console.log('🔍 [Flow IA] Checking for token on Flow.IA site...', { siteUrl: SITE_URL });
    
    // Essayer de récupérer le token depuis le localStorage du site Flow.IA
    // On cherche tous les onglets qui pointent vers le site
    const siteUrlPattern = SITE_URL.replace('http://', '').replace('https://', '').split('/')[0];
    console.log('🔍 [Flow IA] Searching tabs for:', siteUrlPattern);
    
    // Chercher tous les onglets (pas seulement ceux avec l'URL exacte)
    const allTabs = await chrome.tabs.query({});
    console.log('🔍 [Flow IA] Total tabs:', allTabs.length);
    
    // Filtrer les onglets qui correspondent au site
    const matchingTabs = allTabs.filter(tab => 
      tab.url && (
        tab.url.includes(siteUrlPattern) ||
        tab.url.includes('localhost:3000') ||
        tab.url.includes('flowia') ||
        tab.url.includes('flow-ia')
      )
    );
    
    console.log('🔍 [Flow IA] Matching tabs:', matchingTabs.length);
    
    for (const tab of matchingTabs) {
      if (tab.id && tab.url) {
        try {
          console.log('🔍 [Flow IA] Checking tab:', tab.id, tab.url);
          
          // Injecter un script pour récupérer le token
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Essayer plusieurs clés possibles
              const token = localStorage.getItem('token') || 
                           localStorage.getItem('authToken') ||
                           localStorage.getItem('access_token') ||
                           localStorage.getItem('accessToken');
              console.log('🔍 [Flow IA] Token check in tab:', { hasToken: !!token, tokenLength: token?.length });
              return token;
            },
          });
          
          console.log('🔍 [Flow IA] Token result from tab:', { hasResult: !!results?.[0]?.result, tokenLength: results?.[0]?.result?.length });
          
          if (results && results[0]?.result) {
            console.log('✅ [Flow IA] Token found on site!');
            return results[0].result;
          }
        } catch (err: any) {
          console.log('⚠️ [Flow IA] Could not access tab:', err.message);
          // Tab might not be accessible (chrome://, about:, etc.), continue
          continue;
        }
      }
    }
    
    console.log('❌ [Flow IA] No token found on any tab');
  } catch (err: any) {
    console.error('❌ [Flow IA] Error getting token from site:', err);
  }
  
  return null;
}

// Vérifier l'état de connexion au chargement
async function checkAuthStatus(): Promise<void> {
  console.log('🔍 [Flow IA] Checking auth status...');
  
  // D'abord, essayer de récupérer le token depuis le site
  let token = await getTokenFromSite();
  
  // Si pas trouvé, vérifier dans le storage de l'extension
  if (!token) {
    console.log('🔍 [Flow IA] No token from site, checking extension storage...');
    const { authToken } = await chrome.storage.sync.get(['authToken']);
    token = authToken;
    console.log('🔍 [Flow IA] Token from extension storage:', { hasToken: !!token });
  } else {
    console.log('✅ [Flow IA] Token found on site, saving to extension storage...');
    // Sauvegarder le token dans l'extension
    await chrome.storage.sync.set({ authToken: token });
    console.log('✅ [Flow IA] Token saved successfully!');
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
      <p class="text-sm font-semibold text-green-400 mb-2">✓ Connecté à Flow IA</p>
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
  loginForm.style.display = 'block';
  statusDiv.style.display = 'none';
  
  // Afficher le formulaire de connexion
  if (loginForm) {
    loginForm.innerHTML = `
      <div style="padding: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px;">Connexion à Flow IA</h3>
        <p style="font-size: 12px; color: #666; margin-bottom: 16px;">
          Connectez-vous avec vos identifiants Flow IA pour activer la capture automatique.
        </p>
        <input 
          type="email" 
          id="email" 
          placeholder="Email" 
          style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
        />
        <input 
          type="password" 
          id="password" 
          placeholder="Mot de passe" 
          style="width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
        />
        <button 
          id="login-btn" 
          style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
        >
          Se connecter
        </button>
        <p style="font-size: 11px; color: #999; margin-top: 12px; text-align: center;">
          Ou <a href="${SITE_URL}/login" target="_blank" style="color: #667eea; text-decoration: underline;">connectez-vous sur le site</a>
        </p>
      </div>
    `;
    
    // Réattacher les event listeners
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    
    loginBtn?.addEventListener('click', async () => {
      const email = emailInput?.value;
      const password = passwordInput?.value;

      if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';
        
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur de connexion');
        }

        const data = await response.json();
        
        // Sauvegarder le token
        await chrome.storage.sync.set({ authToken: data.access_token || data.accessToken });
        
        // Vérifier le token
        await checkAuthStatus();
        
        alert('✅ Connecté avec succès !');
      } catch (err: any) {
        alert(`Erreur: ${err.message}`);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Se connecter';
      }
    });
  }
  
  if (accountsList) {
    accountsList.innerHTML = '';
  }
}

// Vérifier l'état au chargement
checkAuthStatus();

// Rafraîchir toutes les 5 secondes
setInterval(checkAuthStatus, 5000);

