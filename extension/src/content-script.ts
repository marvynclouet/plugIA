// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERVAL = 30000; // 30 secondes

let timer: NodeJS.Timeout | null = null;
let active = false;

function detectPlatform(): 'tiktok' | 'instagram' | null {
  const host = window.location.hostname;
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('instagram.com')) return 'instagram';
  return null;
}

function isOnNotifications(): boolean {
  const path = window.location.pathname.toLowerCase();
  return path.includes('/notifications') || path.includes('/inbox');
}

async function capture(): Promise<void> {
  const platform = detectPlatform();
  if (!platform || !isOnNotifications()) {
    return;
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

      // Mettre à jour le badge
      chrome.runtime.sendMessage({
        action: 'updateBadge',
        count: data.newInteractions,
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

// Démarrer si on est déjà sur la page notifications
if (isOnNotifications()) {
  start();
}

// Observer les changements d'URL (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (isOnNotifications()) {
      start();
    } else {
      stop();
    }
  }
}).observe(document, { subtree: true, childList: true });

// Écouter les messages du background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start') {
    start();
  } else if (msg.action === 'stop') {
    stop();
  }
});

