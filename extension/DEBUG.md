# 🐛 Guide de Debug - Extension PlugIA

## Comment vérifier que l'extension fonctionne

### 1. Ouvrir la Console du Navigateur

1. Allez sur TikTok/Instagram (page notifications)
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**

### 2. Vérifier les logs

Vous devriez voir des logs comme :

```
🔍 [PlugIA] Checking platform... { platform: 'tiktok', url: '...' }
🔍 [PlugIA] Checking login status... { platform: 'tiktok', isLoggedIn: true, ... }
🔍 [PlugIA] Checking notifications page... { platform: 'tiktok', isOnNotif: true, ... }
📸 [PlugIA] Starting capture for tiktok notifications...
📸 [PlugIA] Requesting screenshot from background...
📸 [PlugIA] Screenshot response: { hasScreenshot: true, length: 12345 }
✅ [PlugIA] Screenshot captured, length: 12345
🔑 [PlugIA] Auth token check: { hasToken: true, tokenLength: 123 }
📡 [PlugIA] Sending screenshot to API...
📡 [PlugIA] API response status: 200
✅ [PlugIA] Analysis result: { success: true, newInteractions: 3 }
```

### 3. Problèmes courants

#### ❌ "Platform not supported"
- **Cause** : Vous n'êtes pas sur TikTok, Instagram, Facebook ou Twitter
- **Solution** : Allez sur une de ces plateformes

#### ❌ "User not logged in"
- **Cause** : Vous n'êtes pas connecté sur le réseau social
- **Solution** : Connectez-vous normalement sur TikTok/Instagram/etc.

#### ❌ "Not on notifications page"
- **Cause** : Vous n'êtes pas sur la page notifications
- **Solution** : Allez sur `/notifications` ou `/direct/inbox/`

#### ❌ "No auth token found"
- **Cause** : Vous n'êtes pas connecté à PlugIA dans l'extension
- **Solution** : 
  1. Cliquez sur l'icône de l'extension
  2. Connectez-vous avec vos identifiants PlugIA
  3. Vérifiez que vous voyez "✓ Connecté à PlugIA"

#### ❌ "API error: 401" ou "API error: 403"
- **Cause** : Token invalide ou expiré
- **Solution** : Reconnectez-vous dans le popup de l'extension

#### ❌ "API error: 500" ou "Network error"
- **Cause** : Le backend n'est pas démarré ou l'URL est incorrecte
- **Solution** : 
  1. Vérifiez que le backend est démarré : `cd backend && npm run start:dev`
  2. Vérifiez l'URL dans `extension/src/content-script.ts` : `API_URL`

### 4. Vérifier le Backend

Ouvrez un terminal et vérifiez les logs du backend :

```bash
cd backend
npm run start:dev
```

Vous devriez voir :
```
[VisionController] Received screenshot for platform: tiktok
[VisionService] Analyzing tiktok screenshot...
[VisionService] Extracted 5 interactions
```

### 5. Vérifier l'Extension Background

1. Allez sur `chrome://extensions/`
2. Trouvez "PlugIA Assistant"
3. Cliquez sur "Inspect views: service worker"
4. Vérifiez les logs dans la console

### 6. Test Manuel

1. **Ouvrir TikTok** : `https://www.tiktok.com/notifications`
2. **Ouvrir la console** : F12 → Console
3. **Vérifier les logs** : Vous devriez voir `[PlugIA]` logs
4. **Attendre 30 secondes** : L'extension capture automatiquement
5. **Vérifier le badge** : Un badge "✓ PlugIA Active" devrait apparaître en bas à droite

### 7. Forcer une Capture

Dans la console du navigateur, tapez :

```javascript
// Vérifier le statut
console.log('Platform:', window.location.hostname);
console.log('Cookies:', document.cookie.substring(0, 100));

// Forcer une capture (si l'extension est chargée)
chrome.runtime.sendMessage({ action: 'capture' }, (response) => {
  console.log('Screenshot:', response);
});
```

---

## Checklist de Debug

- [ ] Extension installée et activée
- [ ] Connecté à PlugIA dans le popup de l'extension
- [ ] Connecté sur TikTok/Instagram/etc. normalement
- [ ] Sur la page Notifications (`/notifications`)
- [ ] Console ouverte (F12)
- [ ] Backend démarré (`npm run start:dev`)
- [ ] Logs visibles dans la console
- [ ] Badge "✓ PlugIA Active" visible

---

Si rien ne fonctionne, partagez les logs de la console ! 🔍

