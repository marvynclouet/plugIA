# PlugIA Chrome Extension

Extension Chrome pour capturer automatiquement les interactions TikTok et Instagram et les analyser avec Claude Vision AI.

## 🚀 Installation

### 1. Build l'extension

```bash
cd extension
npm install
npm run build
```

### 2. Charger dans Chrome

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le **Mode développeur** (en haut à droite)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `extension/`

### 3. Configuration

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Connectez-vous avec vos identifiants PlugIA
3. Allez sur la page **Notifications** de TikTok ou Instagram
4. L'extension capture automatiquement toutes les 30 secondes

## 📋 Fonctionnalités

- ✅ Capture automatique des screenshots de notifications
- ✅ Analyse avec Claude Vision AI
- ✅ Détection automatique des interactions (likes, comments, follows)
- ✅ Envoi automatique au backend PlugIA
- ✅ Badge visuel indiquant l'état actif
- ✅ Notifications pour les nouvelles interactions

## 🔧 Configuration

L'URL de l'API est configurée dans `src/content-script.ts` et `src/popup.ts` :

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

Pour la production, modifiez cette valeur ou utilisez une variable d'environnement.

## 📝 Structure

```
extension/
├── manifest.json          # Configuration de l'extension
├── src/
│   ├── content-script.ts  # Script injecté dans les pages
│   ├── background.ts       # Service worker
│   └── popup.ts            # Script du popup
├── popup/
│   ├── popup.html          # Interface du popup
│   └── popup.css           # Styles du popup
├── icons/                  # Icônes de l'extension
└── dist/                   # Fichiers compilés (généré)
```

## 🛠️ Développement

### Build en mode watch

```bash
npm run watch
```

### Build de production

```bash
npm run build
```

## 🔐 Sécurité

- Le token JWT est stocké dans `chrome.storage.sync` (chiffré par Chrome)
- Les screenshots sont envoyés uniquement au backend autorisé
- L'extension nécessite des permissions explicites

## 📄 Licence

Propriétaire - Tous droits réservés

