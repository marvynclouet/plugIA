# 🚀 Guide d'installation de l'extension Chrome PlugIA

## 📋 Étape 1 : Charger l'extension dans Chrome

### 1. Ouvrir Chrome Extensions

1. Ouvrez Google Chrome
2. Allez sur `chrome://extensions/` (ou Menu → Extensions → Gérer les extensions)
3. **Activez le "Mode développeur"** (toggle en haut à droite)

### 2. Charger l'extension

1. Cliquez sur **"Charger l'extension non empaquetée"** (ou "Load unpacked")
2. Naviguez vers le dossier `extension/` de votre projet
3. Sélectionnez le dossier et cliquez sur **"Sélectionner"**

### 3. Vérifier l'installation

✅ L'extension **PlugIA Assistant** devrait apparaître dans la liste
✅ L'icône 🟣 devrait apparaître dans la barre d'outils Chrome

---

## 🔑 Étape 2 : Se connecter à l'extension

### 1. Ouvrir le popup

1. Cliquez sur l'icône PlugIA dans la barre d'outils Chrome
2. Le popup s'ouvre

### 2. Se connecter

1. Entrez votre **email** et **mot de passe** PlugIA
2. Cliquez sur **"Connexion"**
3. ✅ Vous devriez voir "✓ Connecté"

Le token JWT est maintenant sauvegardé dans Chrome et sera utilisé automatiquement.

---

## 🎬 Étape 3 : Utiliser l'extension

### 1. Aller sur TikTok Notifications

1. Ouvrez un nouvel onglet
2. Allez sur `https://www.tiktok.com/notifications`
3. Connectez-vous à votre compte TikTok si nécessaire

### 2. Activer la capture automatique

✅ **Automatique** : Dès que vous êtes sur la page Notifications, l'extension s'active automatiquement

Vous devriez voir :
- Un badge **"✓ PlugIA Active"** en bas à droite de la page
- Des logs dans la console du navigateur (F12)

### 3. Vérifier les captures

L'extension capture automatiquement :
- **Toutes les 30 secondes** un screenshot de la page
- Envoie à l'API PlugIA pour analyse avec Claude Vision
- Extrait les interactions (likes, comments, follows)

---

## 🔍 Étape 4 : Vérifier que ça fonctionne

### Console du navigateur (F12)

Ouvrez la console (F12 → Console) et vous devriez voir :

```
📸 PlugIA capturing tiktok notifications...
✅ PlugIA analysis result: { success: true, totalAnalyzed: 5, newInteractions: 3 }
```

### Dashboard PlugIA

1. Allez sur `http://localhost:3000/dashboard/interactions`
2. Vous devriez voir les nouvelles interactions détectées
3. Chaque interaction a un **message auto suggéré** généré par l'IA

### Backend logs

Dans le terminal du backend, vous devriez voir :

```
🔍 Analyzing tiktok screenshot with Claude Vision...
✅ Extracted 5 interactions from screenshot
```

---

## ⚙️ Configuration

### Changer l'intervalle de capture

Par défaut : **30 secondes**

Pour modifier, éditez `extension/src/content-script.ts` :

```typescript
const INTERVAL = 30000; // 30 secondes
// Changez en 60000 pour 1 minute, etc.
```

Puis rebuild :
```bash
cd extension
npm run build
```

Rechargez l'extension dans Chrome.

### Changer l'URL de l'API

Par défaut : `http://localhost:3001`

Pour modifier, éditez `extension/src/content-script.ts` et `extension/src/popup.ts` :

```typescript
const API_URL = 'https://votre-api.com';
```

---

## 🐛 Dépannage

### L'extension ne capture pas

1. ✅ Vérifiez que vous êtes sur `/notifications` (pas juste sur TikTok)
2. ✅ Vérifiez la console du navigateur (F12) pour les erreurs
3. ✅ Vérifiez que le backend est démarré (`npm run start:dev` dans `backend/`)
4. ✅ Vérifiez que vous êtes connecté dans le popup de l'extension

### Erreur "No auth token found"

1. Reconnectez-vous via le popup de l'extension
2. Vérifiez que le token est bien sauvegardé (popup → devrait afficher "✓ Connecté")

### Erreur de connexion API

1. Vérifiez que le backend tourne sur `http://localhost:3001`
2. Testez : `curl http://localhost:3001/vision/health`
3. Vérifiez que `ANTHROPIC_API_KEY` est configuré dans `backend/.env`

### Les icônes ne s'affichent pas

Les PNG sont créés. Si problème :
1. Rechargez l'extension dans Chrome
2. Vérifiez que les fichiers `icons/icon*.png` existent

---

## 📊 Prochaines étapes

Une fois l'extension installée et fonctionnelle :

1. ✅ **Tester la capture** : Allez sur TikTok notifications et attendez 30 secondes
2. ✅ **Vérifier le dashboard** : Regardez les interactions dans `/dashboard/interactions`
3. ✅ **Envoyer un DM auto** : Cliquez sur "Envoyer DM auto" pour tester l'envoi automatique
4. ✅ **Configurer l'auto-envoi** : Activez l'envoi automatique pour les leads chauds

---

## 🎯 Workflow complet

```
1. Extension capture screenshot (TikTok/Instagram)
   ↓
2. Envoie à /vision/analyze (Backend)
   ↓
3. Claude Vision analyse et extrait interactions
   ↓
4. Sauvegarde en base de données
   ↓
5. Dashboard affiche les interactions
   ↓
6. IA génère des messages personnalisés
   ↓
7. Utilisateur envoie DM auto (ou automatique)
   ↓
8. Lead qualifié et contact récupéré
```

---

**L'extension est maintenant prête ! 🎉**

