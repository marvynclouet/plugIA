// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERVAL = 30000; // 30 secondes

let timer: NodeJS.Timeout | null = null;
let active = false;

function detectPlatform(): 'tiktok' | 'instagram' | 'facebook' | 'twitter' | null {
  const host = window.location.hostname;
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('facebook.com')) return 'facebook';
  if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter';
  return null;
}

/**
 * Détecte si l'utilisateur est connecté sur la plateforme actuelle
 */
function isUserLoggedIn(platform: string): boolean {
  try {
    switch (platform) {
      case 'tiktok':
        // Vérifier la présence de cookies de session ou d'éléments DOM indiquant une connexion
        const hasTikTokSession = 
          document.cookie.includes('sessionid') || 
          document.cookie.includes('sid_tt') ||
          document.cookie.includes('sid_guard') ||
          document.querySelector('[data-e2e="user-avatar"]') !== null ||
          document.querySelector('[data-e2e="nav-user"]') !== null ||
          document.querySelector('a[href*="/upload"]') !== null; // Bouton upload = connecté
        return hasTikTokSession;
      
      case 'instagram':
        // Vérifier les cookies Instagram ou la présence d'éléments de navigation utilisateur
        const hasInstagramSession = 
          document.cookie.includes('sessionid') ||
          document.cookie.includes('ds_user_id') ||
          document.querySelector('svg[aria-label="Home"]') !== null ||
          document.querySelector('a[href*="/direct/"]') !== null ||
          document.querySelector('a[href*="/accounts/"]') !== null;
        return hasInstagramSession;
      
      case 'facebook':
        const hasFacebookSession = 
          document.cookie.includes('c_user') ||
          document.cookie.includes('xs') ||
          document.querySelector('[aria-label*="Your profile"]') !== null ||
          document.querySelector('[aria-label*="Account"]') !== null;
        return hasFacebookSession;
      
      case 'twitter':
        const hasTwitterSession = 
          document.cookie.includes('auth_token') ||
          document.cookie.includes('ct0') ||
          document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]') !== null ||
          document.querySelector('[data-testid="AppTabBar_Profile_Link"]') !== null;
        return hasTwitterSession;
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

function isOnNotifications(platform: string): boolean {
  switch (platform) {
    case 'tiktok':
      return window.location.pathname.includes('/notifications');
    
    case 'instagram':
      // Instagram notifications peuvent être sur plusieurs pages
      return window.location.pathname.includes('/direct/inbox/') ||
             window.location.pathname.includes('/accounts/activity/') ||
             window.location.pathname === '/'; // Page d'accueil avec notifications
    
    case 'facebook':
      return window.location.pathname.includes('/notifications') ||
             window.location.pathname.includes('/messages');
    
    case 'twitter':
      return window.location.pathname.includes('/notifications') ||
             window.location.pathname.includes('/messages');
    
    default:
      return false;
  }
}

async function capture(): Promise<void> {
  const platform = detectPlatform();
  if (!platform) {
    return; // Pas sur une plateforme supportée
  }

  // Vérifier si l'utilisateur est connecté
  if (!isUserLoggedIn(platform)) {
    console.log(`PlugIA: User not logged in on ${platform}. Skipping capture.`);
    return;
  }

  // Vérifier si on est sur une page de notifications
  if (!isOnNotifications(platform)) {
    return; // Pas sur une page de notifications
  }

  console.log(`📸 PlugIA capturing ${platform} notifications...`);

  // Demander au background script de capturer
  const screenshot = await new Promise<string>((resolve) => {
    chrome.runtime.sendMessage({ action: 'capture' }, (response) => {
      resolve(response?.screenshot || '');
    });
  });

  if (!screenshot) {
    console.warn('⚠️ No screenshot captured');
    return;
  }

  // Récupérer le token d'authentification
  const { authToken } = await chrome.storage.sync.get(['authToken']);
  if (!authToken) {
    console.warn('⚠️ No auth token found. Please login in the extension popup.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/vision/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        screenshot,
        platform,
        url: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ PlugIA analysis result:', data);

    if (data.newInteractions > 0) {
      // Notifier l'utilisateur
      chrome.runtime.sendMessage({
        action: 'notify',
        message: `${data.newInteractions} nouvelles interactions détectées!`,
      });
    }
  } catch (err: any) {
    console.error('❌ PlugIA capture error:', err.message);
  }
}

function start(): void {
  if (active) return;
  active = true;
  console.log('🚀 PlugIA started');
  
  // Capture immédiate
  capture();
  
  // Puis toutes les 30 secondes
  timer = setInterval(capture, INTERVAL);

  // Afficher le badge visuel
  const badge = document.createElement('div');
  badge.id = 'plugia-badge';
  badge.style.cssText =
    'position:fixed;bottom:20px;right:20px;background:#667eea;color:white;padding:10px 18px;border-radius:24px;font-size:13px;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:500;';
  badge.textContent = '✓ PlugIA Active';
  document.body.appendChild(badge);
}

function stop(): void {
  active = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  console.log('⏹️ PlugIA stopped');
  
  const badge = document.getElementById('plugia-badge');
  if (badge) {
    badge.remove();
  }
}

// Fonction pour vérifier et démarrer/arrêter selon les conditions
function checkAndUpdate(): void {
  const platform = detectPlatform();
  if (platform && isUserLoggedIn(platform) && isOnNotifications(platform)) {
    if (!active) {
      start();
    }
  } else {
    if (active) {
      stop();
    }
  }
}

// Initial check
checkAndUpdate();

// Observer les changements d'URL (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndUpdate();
  }
}).observe(document, { subtree: true, childList: true });

// Vérifier périodiquement le statut de connexion (au cas où l'utilisateur se connecte)
setInterval(checkAndUpdate, 5000); // Vérifier toutes les 5 secondes

// Écouter les messages du background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start') {
    start();
  } else if (msg.action === 'stop') {
    stop();
  }
});
