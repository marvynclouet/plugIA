# 🧪 Test Rapide - Extension PlugIA

## ✅ Étapes pour tester

### 1. Recharger l'extension
1. Allez sur `chrome://extensions/`
2. Trouvez "PlugIA Assistant"
3. Cliquez sur le bouton **🔄 Recharger** (icône de rafraîchissement)

### 2. Vérifier la connexion
1. Cliquez sur l'icône PlugIA dans la barre d'outils Chrome
2. Vérifiez que vous voyez "✓ Connecté à PlugIA"
3. Si pas connecté, connectez-vous avec vos identifiants PlugIA

### 3. Aller sur TikTok Notifications
1. Ouvrez un nouvel onglet
2. Allez sur `https://www.tiktok.com/notifications`
3. **OU** cliquez sur l'icône de notifications (avec le badge rouge) dans TikTok

### 4. Ouvrir la console
1. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
2. Allez dans l'onglet **Console**

### 5. Vérifier les logs
Vous devriez voir des logs comme :

```
🔍 [PlugIA] Checking platform... { platform: 'tiktok', url: '...' }
🔍 [PlugIA] Checking login status... { platform: 'tiktok', isLoggedIn: true, ... }
🔍 [PlugIA] Checking notifications page... { platform: 'tiktok', isOnNotif: true, ... }
📸 [PlugIA] Starting capture for tiktok notifications...
```

### 6. Vérifier le badge
- Un badge **"✓ PlugIA Active"** devrait apparaître en **bas à droite** de la page
- Si vous ne le voyez pas, vérifiez les logs dans la console

### 7. Attendre la capture
- L'extension capture **immédiatement** puis **toutes les 30 secondes**
- Vérifiez les logs pour voir si la capture fonctionne

---

## 🐛 Si ça ne fonctionne pas

### Erreur "process is not defined"
✅ **Corrigé !** Rechargez l'extension après le build.

### Pas de logs dans la console
- Vérifiez que l'extension est bien activée dans `chrome://extensions/`
- Vérifiez que vous êtes bien sur TikTok (pas Instagram/Facebook)
- Rechargez la page TikTok (F5)

### "Platform not supported"
- Vérifiez que vous êtes sur `tiktok.com` (pas une autre plateforme)

### "User not logged in"
- Connectez-vous normalement sur TikTok
- Vérifiez que vous voyez vos notifications

### "Not on notifications page"
- Allez bien sur la page Notifications de TikTok
- Cliquez sur l'icône de notifications dans la sidebar gauche

### "No auth token found"
- Cliquez sur l'icône de l'extension
- Connectez-vous avec vos identifiants PlugIA
- Vérifiez que vous voyez "✓ Connecté à PlugIA"

### Pas de badge "PlugIA Active"
- Vérifiez les logs dans la console
- Si les logs montrent que tout est OK mais pas de badge, c'est peut-être un problème de CSS
- Essayez de recharger la page (F5)

---

## 📊 Logs attendus

Si tout fonctionne, vous devriez voir dans la console :

```
🔍 [PlugIA] Checking platform... { platform: 'tiktok', url: 'https://www.tiktok.com/notifications' }
🔍 [PlugIA] Checking login status... { platform: 'tiktok', isLoggedIn: true, cookies: '...' }
🔍 [PlugIA] Checking notifications page... { platform: 'tiktok', isOnNotif: true, pathname: '/notifications' }
🔄 [PlugIA] checkAndUpdate: { platform: 'tiktok', isLoggedIn: true, isOnNotif: true, active: false, url: '...' }
✅ [PlugIA] Conditions met, starting...
🚀 PlugIA started
📸 [PlugIA] Starting capture for tiktok notifications...
📸 [PlugIA] Requesting screenshot from background...
📸 [Background] Message received: capture
📸 [Background] Capturing screenshot...
📸 [Background] Screenshot captured: { hasScreenshot: true, length: 12345 }
📸 [PlugIA] Screenshot response: { hasScreenshot: true, length: 12345 }
✅ [PlugIA] Screenshot captured, length: 12345
🔑 [PlugIA] Auth token check: { hasToken: true, tokenLength: 123 }
📡 [PlugIA] Sending screenshot to API...
📡 [PlugIA] API response status: 200
✅ [PlugIA] Analysis result: { success: true, totalAnalyzed: 5, newInteractions: 3 }
🎉 [PlugIA] 3 nouvelles interactions détectées!
```

---

**Partagez les logs de la console si ça ne fonctionne toujours pas !** 🔍

