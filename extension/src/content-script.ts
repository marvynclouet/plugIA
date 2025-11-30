// Configuration
// Note: process.env n'existe pas dans le navigateur, utiliser une valeur directe
const API_URL = 'http://localhost:3001'; // TODO: Changer en production
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
        // TikTok utilise plusieurs cookies de session
        const hasTikTokCookies = 
          document.cookie.includes('sessionid') || 
          document.cookie.includes('sid_tt') ||
          document.cookie.includes('sid_guard') ||
          document.cookie.includes('sid_ucp_v1') ||
          document.cookie.includes('uid_tt') ||
          document.cookie.includes('ttwid');
        
        // Vérifier les éléments DOM qui indiquent une connexion
        const hasTikTokDOM = 
          document.querySelector('[data-e2e="user-avatar"]') !== null ||
          document.querySelector('[data-e2e="nav-user"]') !== null ||
          document.querySelector('a[href*="/upload"]') !== null ||
          // Vérifier la présence du panneau de notifications (indique qu'on est connecté)
          document.querySelector('div:has-text("Notifications")') !== null ||
          document.querySelector('div:has-text("Toutes les activités")') !== null ||
          // Vérifier la sidebar de navigation (présente seulement si connecté)
          document.querySelector('nav') !== null ||
          document.querySelector('[role="navigation"]') !== null;
        
        return hasTikTokCookies || hasTikTokDOM;
      
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
      // TikTok notifications peut être détecté par :
      // 1. URL contient /notifications
      // 2. Ou présence d'éléments spécifiques aux notifications
      const isNotificationsURL = window.location.pathname.includes('/notifications') || 
                                 window.location.pathname.includes('/notification');
      const hasNotificationsPanel = document.querySelector('[data-e2e="notification-panel"]') !== null ||
                                   document.querySelector('div[class*="notification"]') !== null ||
                                   document.querySelector('div:has-text("Notifications")') !== null ||
                                   document.querySelector('h1:has-text("Notifications")') !== null ||
                                   // Vérifier si on voit des éléments de notifications (liste de followers, likes, etc.)
                                   document.querySelector('div:has-text("Toutes les activités")') !== null ||
                                   document.querySelector('div:has-text("J\'aime")') !== null ||
                                   document.querySelector('div:has-text("Commentaires")') !== null;
      return isNotificationsURL || hasNotificationsPanel;
    
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
  console.log('🔍 [PlugIA] Checking platform...', { platform, url: window.location.href });
  
  if (!platform) {
    console.log('❌ [PlugIA] Platform not supported');
    return; // Pas sur une plateforme supportée
  }

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = isUserLoggedIn(platform);
  console.log('🔍 [PlugIA] Checking login status...', { platform, isLoggedIn, cookies: document.cookie.substring(0, 100) });
  
  if (!isLoggedIn) {
    console.log(`⚠️ [PlugIA] User not logged in on ${platform}. Skipping capture.`);
    return;
  }

  // Vérifier si on est sur une page de notifications
  const isOnNotif = isOnNotifications(platform);
  console.log('🔍 [PlugIA] Checking notifications page...', { platform, isOnNotif, pathname: window.location.pathname });
  
  if (!isOnNotif) {
    console.log(`⚠️ [PlugIA] Not on notifications page for ${platform}`);
    return; // Pas sur une page de notifications
  }

  console.log(`📸 [PlugIA] Starting capture for ${platform} notifications...`);

  // Demander au background script de capturer
  console.log('📸 [PlugIA] Requesting screenshot from background...');
  const screenshot = await new Promise<string>((resolve) => {
    chrome.runtime.sendMessage({ action: 'capture' }, (response) => {
      console.log('📸 [PlugIA] Screenshot response:', { hasScreenshot: !!response?.screenshot, length: response?.screenshot?.length });
      resolve(response?.screenshot || '');
    });
  });

  if (!screenshot) {
    console.error('❌ [PlugIA] No screenshot captured');
    return;
  }

  console.log('✅ [PlugIA] Screenshot captured, length:', screenshot.length);

  // Récupérer le token d'authentification
  const { authToken } = await chrome.storage.sync.get(['authToken']);
  console.log('🔑 [PlugIA] Auth token check:', { hasToken: !!authToken, tokenLength: authToken?.length });
  
  if (!authToken) {
    console.error('❌ [PlugIA] No auth token found. Please login in the extension popup.');
    // Afficher une notification visuelle
    const notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#f87171;color:white;padding:12px 18px;border-radius:8px;z-index:999999;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    notification.textContent = '⚠️ PlugIA: Veuillez vous connecter dans le popup de l\'extension';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    return;
  }

  try {
    console.log('📡 [PlugIA] Sending screenshot to API...', { apiUrl: API_URL, platform, url: window.location.href });
    
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

    console.log('📡 [PlugIA] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PlugIA] API error:', { status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [PlugIA] Analysis result:', data);

    if (data.newInteractions > 0) {
      console.log(`🎉 [PlugIA] ${data.newInteractions} nouvelles interactions détectées!`);
      // Notifier l'utilisateur
      chrome.runtime.sendMessage({
        action: 'notify',
        message: `${data.newInteractions} nouvelles interactions détectées!`,
      });
    } else {
      console.log('ℹ️ [PlugIA] Aucune nouvelle interaction détectée');
    }
  } catch (err: any) {
    console.error('❌ [PlugIA] Capture error:', err);
    console.error('❌ [PlugIA] Error details:', { message: err.message, stack: err.stack });
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
  const isLoggedIn = platform ? isUserLoggedIn(platform) : false;
  const isOnNotif = platform ? isOnNotifications(platform) : false;
  
  console.log('🔄 [PlugIA] checkAndUpdate:', { 
    platform, 
    isLoggedIn, 
    isOnNotif, 
    active, 
    url: window.location.href 
  });
  
  if (platform && isLoggedIn && isOnNotif) {
    if (!active) {
      console.log('✅ [PlugIA] Conditions met, starting...');
      start();
    }
  } else {
    if (active) {
      console.log('⏹️ [PlugIA] Conditions not met, stopping...');
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
