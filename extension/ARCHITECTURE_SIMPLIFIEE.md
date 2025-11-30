# 🚀 Architecture Ultra Simplifiée - PlugIA Extension

## ✨ Principe Fondamental

**L'utilisateur se connecte normalement aux réseaux sociaux dans Chrome. L'extension détecte automatiquement et capture.**

---

## 🎯 Flux Utilisateur

### Installation (1 fois, 2 minutes)

```
1. User va sur plugia.com
2. Clique "Ajouter l'extension Chrome"
3. Extension installée
4. Popup s'ouvre : "Connectez-vous à PlugIA"
5. User entre email/password PlugIA
6. Extension dit : "Go sur TikTok, Instagram, etc."
7. FINI.
```

### Utilisation Quotidienne (automatique)

```
User va sur TikTok/Instagram/Facebook/Twitter
    ↓
Extension détecte : "Ah, il est sur TikTok notifications"
    ↓
Screenshot automatique toutes les 30 secondes
    ↓
Envoi à l'API → Analyse → Dashboard
    ↓
ZERO action de l'user
```

---

## 🔍 Détection Automatique

### Comment l'extension détecte que l'utilisateur est connecté ?

#### TikTok
- ✅ Cookies : `sessionid`, `sid_tt`, `sid_guard`
- ✅ Éléments DOM : `[data-e2e="user-avatar"]`, `[data-e2e="nav-user"]`
- ✅ Bouton upload présent = connecté

#### Instagram
- ✅ Cookies : `sessionid`, `ds_user_id`
- ✅ Éléments DOM : `svg[aria-label="Home"]`, liens `/direct/`, `/accounts/`

#### Facebook
- ✅ Cookies : `c_user`, `xs`
- ✅ Éléments DOM : `[aria-label*="Your profile"]`, `[aria-label*="Account"]`

#### Twitter/X
- ✅ Cookies : `auth_token`, `ct0`
- ✅ Éléments DOM : `[data-testid="SideNav_AccountSwitcher_Button"]`

---

## 📸 Capture Automatique

### Conditions pour capturer :

1. ✅ **Plateforme détectée** (TikTok, Instagram, Facebook, Twitter)
2. ✅ **Utilisateur connecté** (vérifié via cookies + DOM)
3. ✅ **Page de notifications** (URL contient `/notifications`, `/inbox`, etc.)

### Fréquence

- **Capture immédiate** quand les conditions sont remplies
- **Puis toutes les 30 secondes** automatiquement
- **Arrêt automatique** si l'utilisateur quitte la page ou se déconnecte

---

## 🔄 Architecture Technique

```
┌─────────────────────────────────────────────┐
│  USER dans Chrome                            │
│  - Connecté à TikTok normalement             │
│  - Connecté à Instagram normalement          │
│  - Connecté à Facebook normalement           │
│  - Connecté à Twitter normalement            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  EXTENSION CHROME                            │
│  Détecte automatiquement sur quel réseau    │
│  social l'user est connecté                 │
│  (via cookies + DOM)                        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  CAPTURE AUTO (toutes les 30 sec)           │
│  - TikTok /notifications                    │
│  - Instagram /notifications                 │
│  - Facebook /notifications                  │
│  - Twitter /notifications                   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  API BACKEND                                 │
│  POST /vision/analyze                       │
│  - Analyse avec Claude Vision               │
│  - Stocke interactions                      │
│  - Déclenche DM auto                        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  DASHBOARD                                   │
│  Toutes les interactions de toutes les     │
│  plateformes unifiées                       │
└─────────────────────────────────────────────┘
```

---

## ✅ Avantages

1. **Zéro configuration** : L'utilisateur n'a rien à configurer
2. **Zéro maintenance** : Pas de tokens à renouveler, pas de sessions à gérer
3. **Détection automatique** : L'extension sait quand l'utilisateur est connecté
4. **Multi-plateforme** : Fonctionne sur TikTok, Instagram, Facebook, Twitter
5. **Transparent** : L'utilisateur utilise ses réseaux sociaux normalement

---

## 🎨 Interface Utilisateur

### Popup Extension

```
┌─────────────────────────────────┐
│  🔮 PlugIA                       │
│  ─────────────────────────────── │
│                                  │
│  ✓ Connecté à PlugIA            │
│  marie@example.com               │
│                                  │
│  🚀 Comment ça marche :          │
│  1. Allez sur TikTok, Instagram, │
│     Facebook ou Twitter          │
│  2. Connectez-vous normalement  │
│  3. Allez sur la page            │
│     Notifications                │
│  4. L'extension capture          │
│     automatiquement ! ✨         │
│                                  │
│  💡 Astuce : L'extension détecte │
│  automatiquement quand vous êtes │
│  connecté. Aucune configuration │
│  supplémentaire nécessaire !     │
└─────────────────────────────────┘
```

### Badge sur les pages

Quand l'extension est active, un badge apparaît en bas à droite :

```
┌──────────────┐
│ ✓ PlugIA     │
│   Active     │
└──────────────┘
```

---

## 🔧 Configuration Technique

### Content Script

- **Détection de plateforme** : Analyse de l'URL
- **Détection de connexion** : Cookies + éléments DOM
- **Détection de page** : Analyse du pathname
- **Capture** : Screenshot via background script
- **Envoi API** : POST `/vision/analyze`

### Background Script

- **Capture d'écran** : `chrome.tabs.captureVisibleTab()`
- **Notifications** : Chrome notifications API

### Popup

- **Authentification** : Connexion à PlugIA uniquement
- **Instructions** : Guide simple pour l'utilisateur

---

## 🚫 Ce qui n'est PLUS nécessaire

- ❌ OAuth TikTok/Instagram/Facebook
- ❌ QR Code
- ❌ Copie de cookies manuelle
- ❌ Configuration de comptes sociaux
- ❌ Gestion de tokens
- ❌ Renouvellement de sessions

**Tout est automatique ! 🎉**

