// Background service worker pour l'extension PlugIA

// Fonction pour récupérer le token depuis le site Flow.IA
async function getTokenFromSite(): Promise<string | null> {
  try {
    const SITE_URL = 'http://localhost:3000'; // TODO: Changer en production
    const siteUrlPattern = SITE_URL.replace('http://', '').replace('https://', '').split('/')[0];
    const tabs = await chrome.tabs.query({ url: `*://${siteUrlPattern}/*` });
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return localStorage.getItem('token') || 
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('access_token') ||
                     localStorage.getItem('accessToken');
            },
          });
          
          if (results && results[0]?.result) {
            return results[0].result;
          }
        } catch (err) {
          continue;
        }
      }
    }
  } catch (err) {
    console.error('Error getting token from site:', err);
  }
  
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 [Background] Message received:', msg.action);
  
  if (msg.action === 'getTokenFromSite') {
    getTokenFromSite().then((token) => {
      sendResponse({ token });
    });
    return true; // Indique qu'on répondra de manière asynchrone
  }
  
  if (msg.action === 'capture') {
    console.log('📸 [Background] Capturing screenshot...', { tabId: sender.tab?.id, windowId: sender.tab?.windowId });
    // Capturer l'onglet visible (utiliser windowId si disponible, sinon null pour la fenêtre active)
    const windowId = sender.tab?.windowId;
    chrome.tabs.captureVisibleTab(
      windowId || null,
      { format: 'png' },
      (screenshot) => {
        if (chrome.runtime.lastError) {
          console.error('❌ [Background] Capture error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('📸 [Background] Screenshot captured:', { hasScreenshot: !!screenshot, length: screenshot?.length });
          sendResponse({ screenshot });
        }
      },
    );
    return true; // Indique qu'on répondra de manière asynchrone
  }

  if (msg.action === 'notify') {
    console.log('🔔 [Background] Creating notification:', msg.message);
    // Créer une notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'PlugIA',
      message: msg.message || 'Nouvelles interactions détectées!',
    });
  }

  if (msg.action === 'updateBadge') {
    // Mettre à jour le badge de l'extension
    chrome.action.setBadgeText({
      text: msg.count > 0 ? String(msg.count) : '',
    });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  }
});

// Écouter les changements d'onglets pour réinitialiser le badge
chrome.tabs.onActivated.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

