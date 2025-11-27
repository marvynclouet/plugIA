# Configuration TikTok - Guide Complet

## 📋 Étape 1 : Créer une app TikTok

1. Allez sur https://developers.tiktok.com/
2. Connectez-vous avec votre compte TikTok
3. Cliquez sur **"Create an app"** ou **"My Apps"** → **"Create"**

## 📋 Étape 2 : Remplir les informations de l'app

### Informations de base
- **App Name** : Flow IA (ou le nom de votre choix)
- **Category** : Business / Marketing / Other

### Description (120 caractères max)
```
Plateforme d'automatisation des interactions sociales. Gère vos mentions, commentaires et messages TikTok en temps réel avec une IA conversationnelle.
```

**Alternative courte (si besoin)** :
```
Automatisez vos interactions TikTok : réponses IA, gestion des mentions, collecte de leads. Tout en un seul dashboard.
```

### URLs requises
- **Website URL** : `https://flowia.com` (ou votre domaine)
- **Privacy Policy URL** : `https://flowia.com/legal/privacy`
- **Terms of Service URL** : `https://flowia.com/legal/terms`

⚠️ **Important** : Ces pages doivent exister et être accessibles publiquement.

### Platforms
Cochez :
- ✅ **Web** (obligatoire pour OAuth)
- ✅ **Desktop** (optionnel)
- ❌ **Android** (si vous n'avez pas d'app mobile)
- ❌ **iOS** (si vous n'avez pas d'app mobile)

## 📋 Étape 3 : Configurer les Redirect URIs

Dans les paramètres de l'app, ajoutez ces **Redirect URIs** :

```
http://localhost:3000/auth/tiktok/callback
https://flowia.com/auth/tiktok/callback
```

⚠️ **Important** : Les URIs doivent correspondre exactement (pas d'espace, pas de slash final)

## 📋 Étape 3 : App Review - Expliquer les produits et scopes

Dans la section **"App review"**, vous devez expliquer comment chaque produit et scope fonctionne dans votre app.

### Exemple de description pour App Review :

```
Flow IA est une plateforme SaaS qui automatise la gestion des interactions sociales sur TikTok.

PRODUITS UTILISÉS :

1. TikTok Login Kit
   - Permet aux utilisateurs de se connecter à leur compte TikTok via OAuth
   - Utilisé pour authentifier les utilisateurs et accéder à leurs données TikTok

2. TikTok for Developers API
   - Récupération des commentaires sur les vidéos de l'utilisateur
   - Lecture des interactions (likes, commentaires, partages)
   - Envoi de réponses automatiques aux commentaires

SCOPES UTILISÉS :

- user.info.basic : Récupère les informations de base du compte TikTok (nom d'utilisateur, ID) pour identifier l'utilisateur connecté
- user.info.profile : Accède au profil public pour afficher les statistiques de base dans le dashboard
- user.info.stats : Récupère les statistiques du compte (nombre de followers, vues, etc.) pour l'analyse
- video.list : Liste les vidéos publiées par l'utilisateur pour analyser les interactions
- comment.list : Récupère les commentaires sur les vidéos de l'utilisateur pour détecter les mentions et interactions
- comment.create : Permet de répondre automatiquement aux commentaires via l'IA conversationnelle

UTILISATION DES DONNÉES :

Les données TikTok sont utilisées uniquement pour :
- Afficher les interactions dans le dashboard de l'utilisateur
- Détecter les mentions et commentaires nécessitant une réponse
- Envoyer des réponses automatiques personnalisées via IA
- Générer des statistiques et rapports pour l'utilisateur

Les données ne sont jamais partagées avec des tiers et sont stockées de manière sécurisée.
```

### Conseils pour l'App Review :
- ✅ Soyez précis et détaillé
- ✅ Expliquez chaque scope individuellement
- ✅ Décrivez l'utilisation réelle des données
- ✅ Mentionnez la sécurité et la confidentialité
- ❌ Ne soyez pas vague ou générique

## 📋 Étape 4 : Activer les permissions (Scopes)

Dans **"Permissions"** ou **"Scopes"**, activez :

- ✅ `user.info.basic` - Informations de base de l'utilisateur
- ✅ `user.info.profile` - Profil public
- ✅ `user.info.stats` - Statistiques
- ✅ `video.list` - Liste des vidéos
- ✅ `comment.list` - Liste des commentaires
- ✅ `comment.create` - Créer des commentaires (si disponible)

## 📋 Étape 5 : Récupérer les credentials

Une fois l'app créée, vous verrez :

1. **Client Key** (App ID) - C'est votre `TIKTOK_CLIENT_KEY`
2. **Client Secret** - C'est votre `TIKTOK_CLIENT_SECRET`

⚠️ **Important** : Le Client Secret n'est affiché qu'une seule fois. Copiez-le immédiatement !

## 📋 Étape 6 : Configurer backend/.env

Ouvrez `backend/.env` et ajoutez/modifiez :

```env
# TikTok Configuration
TIKTOK_CLIENT_KEY=votre_client_key_ici
TIKTOK_CLIENT_SECRET=votre_client_secret_ici
TIKTOK_REDIRECT_URI=http://localhost:3000/auth/tiktok/callback
TIKTOK_BROWSER_HEADLESS=true
```

⚠️ **Remplacez** `votre_client_key_ici` et `votre_client_secret_ici` par les vraies valeurs.

## 📋 Étape 7 : Redémarrer le backend

```bash
cd backend
# Arrêtez le backend (Ctrl+C)
npm run start:dev
```

## 📋 Étape 8 : Tester la connexion

1. Allez sur `/dashboard/accounts`
2. Cliquez sur **"Connecter TikTok"**
3. Vous serez redirigé vers TikTok pour autoriser l'app
4. Après autorisation, vous serez redirigé vers `/dashboard`

## ⚠️ Problèmes courants

### "Invalid App ID"
- Vérifiez que `TIKTOK_CLIENT_KEY` est correct dans `.env`
- Vérifiez que l'app est bien créée sur https://developers.tiktok.com/

### "Invalid Redirect URI"
- Vérifiez que l'URI dans `.env` correspond exactement à celle configurée dans l'app TikTok
- Pas d'espace, pas de slash final
- `http://localhost:3000/auth/tiktok/callback` (pas `http://localhost:3000/auth/tiktok/callback/`)

### "Invalid Scopes"
- Vérifiez que les scopes sont bien activés dans l'app TikTok
- Les scopes doivent correspondre à ceux demandés par l'app

### L'app n'apparaît pas dans la liste
- Vérifiez que l'app est en mode **"Development"** ou **"Production"**
- En mode Development, seuls les comptes ajoutés comme "Testers" peuvent se connecter

## 🔒 Sécurité

- ⚠️ **Ne partagez JAMAIS** votre `TIKTOK_CLIENT_SECRET`
- ⚠️ Ne commitez **JAMAIS** le fichier `.env` dans Git
- ⚠️ Utilisez des variables d'environnement différentes pour dev/prod

## 📚 Documentation officielle

- TikTok Developers : https://developers.tiktok.com/
- TikTok Login Kit : https://developers.tiktok.com/doc/tiktok-login-kit-web/

