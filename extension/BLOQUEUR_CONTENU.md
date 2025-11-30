# ⚠️ Problème : Requête bloquée (ERR_BLOCKED_BY_CLIENT)

## 🔍 Diagnostic

Si vous voyez cette erreur dans la console :
```
POST http://localhost:3001/vision/analyze net::ERR_BLOCKED_BY_CLIENT
```

Cela signifie qu'un **bloqueur de contenu** (AdBlock, uBlock Origin, etc.) bloque la requête vers l'API backend.

## ✅ Solutions

### Solution 1 : Désactiver le bloqueur pour localhost

1. Cliquez sur l'icône de votre bloqueur de contenu (AdBlock, uBlock, etc.)
2. Cliquez sur "Désactiver sur ce site" ou "Whitelist"
3. Ajoutez `localhost` à la liste blanche

### Solution 2 : Désactiver temporairement le bloqueur

1. Ouvrez les paramètres de votre bloqueur
2. Désactivez-le temporairement pour tester
3. Si ça fonctionne, ajoutez `localhost` à la liste blanche

### Solution 3 : Utiliser un autre navigateur

1. Testez avec Chrome en mode navigation privée (sans extensions)
2. Ou utilisez un profil Chrome sans bloqueurs

## 🔧 Vérifications

1. **Backend démarré ?**
   ```bash
   cd backend
   npm run start:dev
   ```
   Vous devriez voir : `🚀 Backend running on http://localhost:3001`

2. **Extension rechargée ?**
   - Allez sur `chrome://extensions/`
   - Rechargez "Flow IA Assistant"

3. **Token présent ?**
   - Ouvrez la console (F12)
   - Vérifiez : `🔑 [Flow IA] Auth token check: {hasToken: true}`

## 📝 Note

Les bloqueurs de contenu peuvent bloquer les requêtes vers `localhost` par sécurité. C'est normal et prévu. Il faut simplement les désactiver pour `localhost` ou ajouter une exception.

