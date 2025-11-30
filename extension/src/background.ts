// Background service worker pour l'extension PlugIA

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 [Background] Message received:', msg.action);
  
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

