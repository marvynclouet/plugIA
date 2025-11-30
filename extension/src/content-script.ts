// Configuration
const API_URL = 'http://localhost:3001'; // TODO: Changer en production
const INTERVAL = 30000; // 30 secondes

let timer: NodeJS.Timeout | null = null;
let active = false;
let isScrolling = false;

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
        const hasTikTokCookies = 
          document.cookie.includes('sessionid') || 
          document.cookie.includes('sid_tt') ||
          document.cookie.includes('sid_guard') ||
          document.cookie.includes('sid_ucp_v1') ||
          document.cookie.includes('uid_tt') ||
          document.cookie.includes('ttwid') ||
          document.cookie.includes('passport_csrf_token');
        
        const bodyText = document.body?.textContent || '';
        const hasNotificationsText = 
          bodyText.includes('Notifications') ||
          bodyText.includes('Toutes les activités') ||
          bodyText.includes('J\'aime') ||
          bodyText.includes('Commentaires');
        
        const hasTikTokDOM = 
          document.querySelector('[data-e2e="user-avatar"]') !== null ||
          document.querySelector('[data-e2e="nav-user"]') !== null ||
          document.querySelector('a[href*="/upload"]') !== null ||
          document.querySelector('nav') !== null ||
          document.querySelector('[role="navigation"]') !== null ||
          document.querySelector('[data-e2e="nav-inbox"]') !== null ||
          document.querySelector('svg[aria-label*="Inbox"]') !== null ||
          hasNotificationsText;
        
        return hasTikTokCookies || hasTikTokDOM;
      
      case 'instagram':
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
    console.error('❌ [Flow IA] Error checking login status:', error);
    return false;
  }
}

function isOnNotifications(platform: string): boolean {
  switch (platform) {
    case 'tiktok':
      const isNotificationsURL = window.location.pathname.includes('/notifications') || 
                                 window.location.pathname.includes('/notification');
      
      if (isNotificationsURL) {
        return true;
      }
      
      const bodyText = document.body?.textContent || document.body?.innerText || '';
      const hasNotificationsText = 
        bodyText.includes('Notifications') ||
        bodyText.includes('Toutes les activités') ||
        bodyText.includes('J\'aime') ||
        bodyText.includes('Commentaires') ||
        bodyText.includes('Mentions et étiquettes') ||
        bodyText.includes('Followers');
      
      const hasNotificationsElements = 
        document.querySelector('[data-e2e="notification-panel"]') !== null ||
        document.querySelector('div[class*="notification"]') !== null ||
        document.querySelector('div[class*="Notification"]') !== null ||
        Array.from(document.querySelectorAll('div, span, h1, h2, h3')).some(el => {
          const text = el.textContent?.trim() || '';
          return text === 'Notifications' || text.includes('Toutes les activités');
        });
      
      return hasNotificationsText || hasNotificationsElements;
    
    case 'instagram':
      return window.location.pathname.includes('/direct/inbox/') ||
             window.location.pathname.includes('/accounts/activity/') ||
             window.location.pathname === '/';
    
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

/**
 * Scroll automatiquement jusqu'en bas de la page pour charger toutes les interactions
 */
async function scrollToBottom(): Promise<void> {
  if (isScrolling) return;
  isScrolling = true;
  
  console.log('📜 [Flow IA] Starting auto-scroll to load all interactions...');
  
  let lastHeight = 0;
  let sameHeightCount = 0;
  const maxSameHeight = 3; // Arrêter si la hauteur ne change pas 3 fois de suite
  
  return new Promise((resolve) => {
    const scrollInterval = setInterval(() => {
      const currentHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, currentHeight);
      
      // Attendre un peu pour que le contenu se charge
      setTimeout(() => {
        const newHeight = document.documentElement.scrollHeight;
        
        if (newHeight === lastHeight) {
          sameHeightCount++;
          if (sameHeightCount >= maxSameHeight) {
            console.log('✅ [Flow IA] Reached bottom, all interactions loaded');
            clearInterval(scrollInterval);
            isScrolling = false;
            resolve();
          }
        } else {
          sameHeightCount = 0;
          lastHeight = newHeight;
        }
      }, 500);
    }, 1000);
    
    // Timeout de sécurité (30 secondes max)
    setTimeout(() => {
      clearInterval(scrollInterval);
      isScrolling = false;
      console.log('⏱️ [Flow IA] Scroll timeout reached');
      resolve();
    }, 30000);
  });
}

/**
 * Extrait les interactions TikTok depuis le DOM
 * Analyse le texte visible pour détecter les patterns d'interactions
 */
function extractTikTokInteractions(): Array<{
  username: string;
  displayName?: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  timestamp: string;
  content?: string;
  videoUrl?: string;
}> {
  const interactions: Array<{
    username: string;
    displayName?: string;
    type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
    timestamp: string;
    content?: string;
    videoUrl?: string;
  }> = [];
  
  try {
    console.log('🔍 [Flow IA] Extracting interactions from DOM...');
    
    // Obtenir tout le texte visible de la page
    const bodyText = document.body?.textContent || '';
    const bodyInnerText = document.body?.innerText || '';
    
    // Diviser le texte en lignes pour analyser chaque notification
    const lines = bodyText.split('\n').filter(line => line.trim().length > 0);
    
    // Patterns pour détecter les interactions TikTok (français et anglais)
    const patterns = {
      like: [
        /^([a-zA-Z0-9_.]+)\s+a\s+aimé\s+(votre\s+vidéo|une\s+vidéo\s+que\s+tu\s+as\s+republiée)/i,
        /^([a-zA-Z0-9_.]+)\s+liked\s+(your\s+video|a\s+video\s+you\s+reposted)/i,
        /^([a-zA-Z0-9_.]+)\s+a\s+aimé\s+ta\s+vidéo/i,
      ],
      comment: [
        /^([a-zA-Z0-9_.]+)\s*:\s*(.+)/, // Format: "username: comment text"
        /^([a-zA-Z0-9_.]+)\s+a\s+commenté/i,
        /^([a-zA-Z0-9_.]+)\s+commented/i,
      ],
      follow: [
        /^([a-zA-Z0-9_.]+)\s+(vous\s+suit|a\s+commencé\s+à\s+te\s+suivre|started\s+following\s+you)/i,
        /^([a-zA-Z0-9_.]+)\s+commencé\s+à\s+te\s+suivre/i,
      ],
      mention: [
        /^([a-zA-Z0-9_.]+)\s+(vous\s+a\s+mentionné|t'a\s+mentionné|mentioned\s+you)/i,
        /^([a-zA-Z0-9_.]+)\s+t'a\s+mentionné/i,
      ],
      share: [
        /^([a-zA-Z0-9_.]+)\s+(a\s+partagé|a\s+reposté|shared|reposted)/i,
        /^([a-zA-Z0-9_.]+)\s+(a\s+reposté\s+la\s+même\s+vidéo|reposted\s+the\s+same\s+video)/i,
      ],
    };
    
    // Extraire les timestamps (ex: "il y a 2h", "2h", "22min", "1 jour")
    const timePattern = /(il\s+y\s+a\s+)?(\d+)\s*(min|h|jour|day|hour|minute|minutes|hours|days)?/i;
    
    // Analyser chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 3) continue; // Ignorer les lignes trop courtes
      
      let matched = false;
      let interactionType: 'like' | 'comment' | 'follow' | 'share' | 'mention' | null = null;
      let username = '';
      let content = '';
      let timestamp = '';
      
      // Chercher le timestamp dans la ligne ou les lignes suivantes
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        timestamp = timeMatch[0];
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const nextTimeMatch = nextLine.match(timePattern);
        if (nextTimeMatch) {
          timestamp = nextTimeMatch[0];
        }
      }
      
      // Tester chaque type d'interaction
      for (const [type, typePatterns] of Object.entries(patterns)) {
        for (const pattern of typePatterns) {
          const match = line.match(pattern);
          if (match) {
            username = match[1];
            interactionType = type as any;
            
            // Pour les commentaires, extraire le contenu
            if (type === 'comment' && match[2]) {
              content = match[2].trim();
            }
            
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      
      // Si on a trouvé une interaction
      if (matched && username && interactionType) {
        // Chercher le nom d'affichage (peut être dans la ligne précédente ou suivante)
        let displayName = username;
        if (i > 0) {
          const prevLine = lines[i - 1].trim();
          // Si la ligne précédente ressemble à un nom (pas de pattern d'interaction)
          if (prevLine && !prevLine.match(/\d+\s*(min|h|jour)/i) && prevLine.length < 50) {
            displayName = prevLine;
          }
        }
        
        interactions.push({
          username,
          displayName: displayName !== username ? displayName : undefined,
          type: interactionType,
          timestamp: timestamp || 'unknown',
          content: content || undefined,
        });
      }
    }
    
    // Méthode alternative : Chercher dans les éléments DOM structurés
    // TikTok utilise souvent des divs avec des classes spécifiques
    const notificationElements = document.querySelectorAll('div[class*="notification"], div[class*="item"], div[class*="Item"]');
    
    for (const element of Array.from(notificationElements)) {
      const text = element.textContent || '';
      const innerText = element.innerText || '';
      
      // Pattern pour les likes
      if (text.match(/a\s+aimé|liked/i) && !interactions.some(i => i.type === 'like' && text.includes(i.username))) {
        const usernameMatch = text.match(/^([a-zA-Z0-9_.]+)/);
        const timeMatch = text.match(timePattern);
        
        if (usernameMatch) {
          interactions.push({
            username: usernameMatch[1],
            type: 'like',
            timestamp: timeMatch ? timeMatch[0] : 'unknown',
          });
        }
      }
      
      // Pattern pour les commentaires
      if (text.match(/commenté|commented|:/i) && !interactions.some(i => i.type === 'comment' && text.includes(i.username))) {
        const usernameMatch = text.match(/^([a-zA-Z0-9_.]+)\s*:/);
        const timeMatch = text.match(timePattern);
        const commentText = text.split(':').slice(1).join(':').trim();
        
        if (usernameMatch && commentText.length > 5) {
          interactions.push({
            username: usernameMatch[1],
            type: 'comment',
            timestamp: timeMatch ? timeMatch[0] : 'unknown',
            content: commentText.substring(0, 500),
          });
        }
      }
      
      // Pattern pour les follows
      if (text.match(/vous\s+suit|commencé\s+à\s+te\s+suivre|started\s+following/i) && !interactions.some(i => i.type === 'follow' && text.includes(i.username))) {
        const usernameMatch = text.match(/^([a-zA-Z0-9_.]+)/);
        const timeMatch = text.match(timePattern);
        
        if (usernameMatch) {
          interactions.push({
            username: usernameMatch[1],
            type: 'follow',
            timestamp: timeMatch ? timeMatch[0] : 'unknown',
          });
        }
      }
    }
    
    // Dédupliquer par username + type + timestamp
    const uniqueInteractions = interactions.filter((interaction, index, self) =>
      index === self.findIndex((i) => 
        i.username.toLowerCase() === interaction.username.toLowerCase() &&
        i.type === interaction.type &&
        Math.abs(
          (i.timestamp.match(/\d+/)?.[0] || '0') - (interaction.timestamp.match(/\d+/)?.[0] || '0')
        ) < 2 // Tolérance de 2 unités de temps
      )
    );
    
    console.log(`✅ [Flow IA] Extracted ${uniqueInteractions.length} unique interactions from DOM (from ${interactions.length} total)`);
    return uniqueInteractions;
    
  } catch (error) {
    console.error('❌ [Flow IA] Error extracting interactions:', error);
    return [];
  }
}

/**
 * Capture et extrait les interactions depuis le DOM
 */
async function capture(): Promise<void> {
  const platform = detectPlatform();
  console.log('🔍 [Flow IA] Checking platform...', { platform, url: window.location.href });
  
  if (!platform) {
    console.log('❌ [Flow IA] Platform not supported');
    return;
  }

  const isLoggedIn = isUserLoggedIn(platform);
  console.log('🔍 [Flow IA] Checking login status...', { platform, isLoggedIn });
  
  if (!isLoggedIn) {
    console.log(`⚠️ [Flow IA] User not logged in on ${platform}. Skipping capture.`);
    return;
  }

  const isOnNotif = isOnNotifications(platform);
  console.log('🔍 [Flow IA] Checking notifications page...', { platform, isOnNotif, pathname: window.location.pathname });
  
  if (!isOnNotif) {
    console.log(`⚠️ [Flow IA] Not on notifications page for ${platform}`);
    return;
  }

  console.log(`📸 [Flow IA] Starting DOM extraction for ${platform} notifications...`);

  // Récupérer le token d'authentification
  let { authToken } = await chrome.storage.sync.get(['authToken']);
  
  if (!authToken) {
    console.log('🔍 [Flow IA] No token in extension storage, trying to get from site...');
    try {
      const tokenFromSite = await new Promise<string | null>((resolve) => {
        chrome.runtime.sendMessage({ action: 'getTokenFromSite' }, (response) => {
          console.log('🔍 [Flow IA] Response from background:', { hasToken: !!response?.token });
          resolve(response?.token || null);
        });
      });
      
      if (tokenFromSite) {
        console.log('✅ [Flow IA] Token found on site, saving to extension storage...');
        authToken = tokenFromSite;
        await chrome.storage.sync.set({ authToken: tokenFromSite });
        console.log('✅ [Flow IA] Token saved successfully!');
      } else {
        console.log('❌ [Flow IA] No token found on site either');
      }
    } catch (err) {
      console.error('❌ [Flow IA] Error getting token from site:', err);
    }
  }
  
  console.log('🔑 [Flow IA] Auth token check:', { hasToken: !!authToken, tokenLength: authToken?.length });
  
  if (!authToken) {
    console.error('❌ [Flow IA] No auth token found. Trying to get from site one more time...');
    
    try {
      const tokenFromSite = await new Promise<string | null>((resolve) => {
        chrome.runtime.sendMessage({ action: 'getTokenFromSite' }, (response) => {
          resolve(response?.token || null);
        });
      });
      
      if (tokenFromSite) {
        console.log('✅ [Flow IA] Token found on site at last attempt!');
        authToken = tokenFromSite;
        await chrome.storage.sync.set({ authToken: tokenFromSite });
      }
    } catch (err) {
      console.error('❌ [Flow IA] Error in last attempt:', err);
    }
    
    if (!authToken) {
      const notification = document.createElement('div');
      notification.id = 'flowia-auth-warning';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        z-index: 999999;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(248, 113, 113, 0.4);
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">🔐</div>
          <div>
            <div style="font-weight: 700; margin-bottom: 4px;">Connexion requise</div>
            <div style="font-size: 12px; opacity: 0.9; font-weight: 400;">
              Cliquez sur l'icône Flow IA dans la barre d'outils Chrome pour vous connecter
            </div>
          </div>
        </div>
      `;
      
      if (!document.getElementById('flowia-notification-style')) {
        const style = document.createElement('style');
        style.id = 'flowia-notification-style';
        style.textContent = `
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
      
      const checkToken = setInterval(() => {
        chrome.storage.sync.get(['authToken'], (result) => {
          if (result.authToken) {
            notification.remove();
            clearInterval(checkToken);
          }
        });
      }, 2000);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
        clearInterval(checkToken);
      }, 30000);
      
      return;
    }
  }

  try {
    // 1. Scroll automatiquement pour charger toutes les interactions
    await scrollToBottom();
    
    // 2. Extraire les interactions depuis le DOM
    const interactions = extractTikTokInteractions();
    
    if (interactions.length === 0) {
      console.log('ℹ️ [Flow IA] No interactions found in DOM');
      return;
    }
    
    console.log(`📊 [Flow IA] Extracted ${interactions.length} interactions, sending to API...`);
    
    // 3. Envoyer à l'API
    const response = await fetch(`${API_URL}/vision/extract-dom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        platform,
        url: window.location.href,
        interactions,
        extractedAt: new Date().toISOString(),
      }),
    });

    console.log('📡 [Flow IA] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Flow IA] API error:', { status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [Flow IA] Extraction result:', data);

    if (data.newInteractions > 0) {
      console.log(`🎉 [Flow IA] ${data.newInteractions} nouvelles interactions détectées!`);
      chrome.runtime.sendMessage({
        action: 'notify',
        message: `${data.newInteractions} nouvelles interactions détectées!`,
      });
    } else {
      console.log('ℹ️ [Flow IA] Aucune nouvelle interaction détectée');
    }
  } catch (err: any) {
    console.error('❌ [Flow IA] Capture error:', err);
    console.error('❌ [Flow IA] Error details:', { message: err.message, stack: err.stack });
  }
}

function start(): void {
  if (active) return;
  active = true;
  console.log('🚀 [Flow IA] Started');
  
  // Capture immédiate
  capture();
  
  // Puis toutes les 30 secondes
  timer = setInterval(capture, INTERVAL);

  // Afficher le badge visuel
  const badge = document.createElement('div');
  badge.id = 'flowia-badge';
  badge.style.cssText =
    'position:fixed;bottom:20px;right:20px;background:#667eea;color:white;padding:10px 18px;border-radius:24px;font-size:13px;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:500;';
  badge.textContent = '✓ Flow IA Active';
  document.body.appendChild(badge);
}

function stop(): void {
  active = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  console.log('⏹️ [Flow IA] Stopped');
  
  const badge = document.getElementById('flowia-badge');
  if (badge) {
    badge.remove();
  }
}

// Fonction pour vérifier et démarrer/arrêter selon les conditions
function checkAndUpdate(): void {
  const platform = detectPlatform();
  const isLoggedIn = platform ? isUserLoggedIn(platform) : false;
  const isOnNotif = platform ? isOnNotifications(platform) : false;
  
  console.log('🔄 [Flow IA] checkAndUpdate:', { 
    platform, 
    isLoggedIn, 
    isOnNotif, 
    active, 
    url: window.location.href 
  });
  
  if (platform && isLoggedIn && isOnNotif) {
    if (!active) {
      console.log('✅ [Flow IA] Conditions met, starting...');
      start();
    }
  } else {
    if (active) {
      console.log('⏹️ [Flow IA] Conditions not met, stopping...');
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
