// Background service worker pour l'extension PlugIA

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture') {
    // Capturer l'onglet visible
    chrome.tabs.captureVisibleTab(
      null,
      { format: 'png' },
      (screenshot) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Capture error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ screenshot });
        }
      },
    );
    return true; // Indique qu'on répondra de manière asynchrone
  }

  if (msg.action === 'notify') {
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

