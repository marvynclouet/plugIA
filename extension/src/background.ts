// Background service worker pour l'extension PlugIA

// Fonction pour récupérer le token depuis le site Flow.IA
async function getTokenFromSite(): Promise<string | null> {
  try {
    const SITE_URL = 'http://localhost:3000'; // TODO: Changer en production
    const siteUrlPattern = SITE_URL.replace('http://', '').replace('https://', '').split('/')[0];
    
    console.log('🔍 [Background] Searching for Flow.IA tabs...', { siteUrlPattern });
    
    // Chercher tous les onglets (plus large recherche)
    const allTabs = await chrome.tabs.query({});
    const matchingTabs = allTabs.filter(tab => 
      tab.url && (
        tab.url.includes(siteUrlPattern) ||
        tab.url.includes('localhost:3000') ||
        tab.url.includes('flowia') ||
        tab.url.includes('flow-ia')
      )
    );
    
    console.log('🔍 [Background] Found matching tabs:', matchingTabs.length);
    
    for (const tab of matchingTabs) {
      if (tab.id && tab.url) {
        try {
          console.log('🔍 [Background] Checking tab:', tab.id, tab.url);
          
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const token = localStorage.getItem('token') || 
                           localStorage.getItem('authToken') ||
                           localStorage.getItem('access_token') ||
                           localStorage.getItem('accessToken');
              console.log('🔍 [Background] Token in tab:', { hasToken: !!token });
              return token;
            },
          });
          
          if (results && results[0]?.result) {
            console.log('✅ [Background] Token found!');
            return results[0].result;
          }
        } catch (err: any) {
          console.log('⚠️ [Background] Could not access tab:', err.message);
          continue;
        }
      }
    }
    
    console.log('❌ [Background] No token found');
  } catch (err: any) {
    console.error('❌ [Background] Error getting token from site:', err);
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
      title: 'Flow IA',
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

  if (msg.action === 'sendToAPI') {
    // Faire la requête API depuis le background script (non bloqué par les bloqueurs de contenu)
    const API_URL = 'http://localhost:3001'; // TODO: Changer en production
    console.log('📡 [Background] Sending request to API:', msg.endpoint);
    
    (async () => {
      try {
        const response = await fetch(`${API_URL}${msg.endpoint}`, {
          method: msg.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${msg.token}`,
          },
          body: JSON.stringify(msg.data),
        });

        console.log('📡 [Background] API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [Background] API error:', { status: response.status, error: errorText });
          sendResponse({ error: `HTTP ${response.status}: ${errorText}` });
          return;
        }

        const data = await response.json();
        console.log('✅ [Background] API response:', data);
        sendResponse(data);
      } catch (err: any) {
        console.error('❌ [Background] Fetch error:', err);
        sendResponse({ error: err.message || 'Failed to fetch' });
      }
    })();
    
    return true; // Indique qu'on répondra de manière asynchrone
  }
});

// Écouter les changements d'onglets pour réinitialiser le badge
chrome.tabs.onActivated.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

