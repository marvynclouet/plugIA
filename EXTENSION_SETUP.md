# 🚀 Guide d'installation rapide - Extension Chrome PlugIA

## ✅ Ce qui a été créé

### Backend
- ✅ Module Vision (`backend/src/vision/`)
  - `VisionService` : Analyse de screenshots avec Claude Vision
  - `VisionController` : Endpoints API `/vision/analyze` et `/vision/health`
  - Intégration avec Prisma pour sauvegarder les interactions

### Extension Chrome
- ✅ Structure complète dans `extension/`
  - Content script pour capture automatique
  - Background service worker
  - Popup d'authentification
  - Build configuré avec esbuild

## 📋 Étapes d'installation

### 1. Backend - Configuration

1. **Ajouter la clé Anthropic dans `.env`** :
```bash
cd backend
echo "ANTHROPIC_API_KEY=sk-ant-api03-VOTRE_CLE" >> .env
```

2. **Vérifier que le backend compile** :
```bash
npm run build
```

3. **Démarrer le backend** :
```bash
npm run start:dev
```

4. **Tester l'endpoint Vision** :
```bash
curl http://localhost:3001/vision/health
```

### 2. Extension Chrome - Build

1. **Installer les dépendances** :
```bash
cd extension
npm install
```

2. **Build l'extension** :
```bash
npm run build
```

3. **Créer les icônes** (optionnel pour tester) :
   - Créez 3 images PNG (16x16, 48x48, 128x128)
   - Ou utilisez un générateur en ligne : https://www.favicon-generator.org/
   - Placez-les dans `extension/icons/`

### 3. Charger l'extension dans Chrome

1. Ouvrez Chrome
2. Allez sur `chrome://extensions/`
3. Activez le **Mode développeur** (toggle en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier `extension/`

### 4. Configuration de l'extension

1. **Cliquez sur l'icône PlugIA** dans la barre d'outils Chrome
2. **Connectez-vous** avec vos identifiants PlugIA
3. Le token sera sauvegardé automatiquement

### 5. Test

1. **Ouvrez TikTok** dans un nouvel onglet
2. **Allez sur la page Notifications** : `https://www.tiktok.com/notifications`
3. **Vérifiez** :
   - Un badge "✓ PlugIA Active" apparaît en bas à droite
   - La console du navigateur affiche les logs de capture
   - Les screenshots sont envoyés au backend toutes les 30 secondes

## 🔍 Vérification

### Backend
```bash
# Vérifier les logs
tail -f backend/logs/*.log

# Ou dans la console du backend
# Vous devriez voir :
# ✅ Anthropic Claude initialized for Vision AI
# 📸 Analyzing tiktok screenshot...
# ✅ Extracted X interactions from screenshot
```

### Extension
- Ouvrez la console du navigateur (F12)
- Allez sur la page Notifications
- Vous devriez voir :
  ```
  📸 PlugIA capturing tiktok notifications...
  ✅ PlugIA analysis result: { success: true, totalAnalyzed: 5, newInteractions: 3 }
  ```

## 🐛 Dépannage

### L'extension ne capture pas
- Vérifiez que vous êtes sur la page `/notifications`
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que le token est bien sauvegardé (popup extension)

### Erreur "No auth token found"
- Reconnectez-vous via le popup de l'extension
- Vérifiez que le backend est démarré

### Erreur "Anthropic client not initialized"
- Vérifiez que `ANTHROPIC_API_KEY` est bien dans `backend/.env`
- Redémarrez le backend après avoir ajouté la clé

### Les icônes ne s'affichent pas
- Créez des fichiers PNG dans `extension/icons/`
- Voir `extension/ICONS.md` pour les instructions

## 📚 Documentation

- **Extension** : `extension/README.md`
- **Icônes** : `extension/ICONS.md`
- **Backend Vision** : `backend/src/vision/README.md` (à créer si besoin)

## 🎯 Prochaines étapes

1. ✅ Tester la capture sur TikTok
2. ✅ Tester la capture sur Instagram
3. ✅ Vérifier que les interactions sont bien sauvegardées en DB
4. ✅ Vérifier l'analyse IA dans le dashboard

---

**L'extension est maintenant prête à être utilisée ! 🎉**

