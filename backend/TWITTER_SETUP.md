# Configuration Twitter (X) - Guide Complet

## 📋 Étape 1 : Créer une app Twitter

1. Allez sur https://developer.twitter.com/
2. Connectez-vous avec votre compte Twitter/X
3. Allez dans **"Developer Portal"** → **"Projects & Apps"**
4. Cliquez sur **"Create App"** ou **"Create Project"**

## 📋 Étape 2 : Créer un projet (si nécessaire)

Si c'est votre première app :
- **Project Name** : Flow IA
- **Use case** : Making a bot / Building a solution for my own use
- **Description** : Plateforme d'automatisation des interactions sociales

## 📋 Étape 3 : Créer une app dans le projet

- **App Name** : Flow IA App
- **App environment** : Development (puis Production plus tard)
- **Description** : Automatisation des interactions Twitter

## 📋 Étape 4 : Configurer les OAuth 2.0 Settings

Dans les paramètres de l'app, section **"User authentication settings"** :

1. **App permissions** : Sélectionnez les permissions nécessaires :
   - ✅ **Read** - Lire les tweets, mentions, etc.
   - ✅ **Write** - Écrire des tweets, répondre, etc.
   - ✅ **Direct Messages** - Envoyer et recevoir des DM

2. **Type of App** : **Web App, Automated App or Bot**

3. **Callback URI / Redirect URL** : Ajoutez :
   ```
   http://localhost:3000/auth/twitter/callback
   https://flowia.com/auth/twitter/callback
   ```

4. **Website URL** : `https://flowia.com`

5. Cliquez sur **"Save"**

## 📋 Étape 5 : Générer les credentials

Une fois l'app créée, allez dans **"Keys and tokens"** :

1. **API Key** (Consumer Key) - C'est votre `TWITTER_API_KEY`
2. **API Key Secret** (Consumer Secret) - C'est votre `TWITTER_API_SECRET`
3. **Bearer Token** - Optionnel, pour certaines opérations

⚠️ **Important** : 
- Les secrets ne sont affichés qu'une seule fois
- Copiez-les immédiatement dans un endroit sûr
- Ne les partagez JAMAIS publiquement

## 📋 Étape 6 : Configurer les OAuth 2.0 Client ID et Secret

Pour OAuth 2.0 (recommandé pour les apps modernes) :

1. Dans **"User authentication settings"**, générez :
   - **Client ID** - C'est votre `TWITTER_CLIENT_ID`
   - **Client Secret** - C'est votre `TWITTER_CLIENT_SECRET`

2. Si vous utilisez OAuth 1.0a (ancien), utilisez :
   - **API Key** → `TWITTER_API_KEY`
   - **API Secret** → `TWITTER_API_SECRET`
   - **Access Token** → `TWITTER_ACCESS_TOKEN`
   - **Access Token Secret** → `TWITTER_ACCESS_TOKEN_SECRET`

## 📋 Étape 7 : Configurer backend/.env

Ouvrez `backend/.env` et ajoutez :

### Option 1 : OAuth 2.0 (Recommandé)
```env
# Twitter (X) Configuration - OAuth 2.0
TWITTER_CLIENT_ID=votre_client_id_ici
TWITTER_CLIENT_SECRET=votre_client_secret_ici
TWITTER_REDIRECT_URI=http://localhost:3000/auth/twitter/callback
```

### Option 2 : OAuth 1.0a (Ancien)
```env
# Twitter (X) Configuration - OAuth 1.0a
TWITTER_API_KEY=votre_api_key_ici
TWITTER_API_SECRET=votre_api_secret_ici
TWITTER_ACCESS_TOKEN=votre_access_token_ici
TWITTER_ACCESS_TOKEN_SECRET=votre_access_token_secret_ici
TWITTER_REDIRECT_URI=http://localhost:3000/auth/twitter/callback
```

⚠️ **Remplacez** toutes les valeurs par les vraies credentials de votre app.

## 📋 Étape 8 : Demander l'accès Elevated

Par défaut, Twitter donne un accès **Essential** (limité). Pour plus de fonctionnalités :

1. Allez dans **"Developer Portal"** → **"Projects & Apps"** → Votre app
2. Cliquez sur **"Settings"** → **"User authentication settings"**
3. Faites une demande pour **"Elevated"** access
4. Remplissez le formulaire avec :
   - **Use case description** : Automatisation des interactions sociales, gestion des mentions, réponses automatiques
   - **How will you use Twitter data?** : Pour automatiser les réponses aux mentions et DM
5. Attendez l'approbation (peut prendre quelques jours)

## 📋 Étape 9 : Redémarrer le backend

```bash
cd backend
# Arrêtez le backend (Ctrl+C)
npm run start:dev
```

## 📋 Étape 10 : Tester la connexion

1. Allez sur `/dashboard/accounts`
2. Cliquez sur **"Connecter X (Twitter)"**
3. Vous serez redirigé vers Twitter pour autoriser l'app
4. Après autorisation, vous serez redirigé vers `/dashboard`

## ⚠️ Problèmes courants

### "Invalid Client ID" ou "Invalid API Key"
- Vérifiez que les credentials sont corrects dans `.env`
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
- Vérifiez que l'app est bien créée sur https://developer.twitter.com/

### "Invalid Redirect URI"
- Vérifiez que l'URI dans `.env` correspond exactement à celle configurée dans l'app Twitter
- Pas d'espace, pas de slash final
- `http://localhost:3000/auth/twitter/callback` (pas `http://localhost:3000/auth/twitter/callback/`)

### "Insufficient permissions"
- Vérifiez que les permissions sont bien activées (Read, Write, Direct Messages)
- Si vous utilisez des fonctionnalités avancées, demandez l'accès **Elevated**

### "Rate limit exceeded"
- Twitter limite le nombre de requêtes par 15 minutes
- Avec l'accès Essential : ~300 requêtes / 15 min
- Avec l'accès Elevated : ~1500 requêtes / 15 min
- Implémentez un système de rate limiting dans votre code

### L'app n'apparaît pas
- Vérifiez que l'app est en mode **"Development"** ou **"Production"**
- En mode Development, seuls les comptes autorisés peuvent se connecter

## 🔒 Sécurité

- ⚠️ **Ne partagez JAMAIS** vos secrets Twitter
- ⚠️ Ne commitez **JAMAIS** le fichier `.env` dans Git
- ⚠️ Utilisez des variables d'environnement différentes pour dev/prod
- ⚠️ Régénérez les tokens si vous pensez qu'ils ont été compromis

## 📊 Types d'accès Twitter

### Essential (Gratuit)
- 300 requêtes / 15 min
- Fonctionnalités de base
- Parfait pour commencer

### Elevated (Gratuit, sur demande)
- 1500 requêtes / 15 min
- Plus de fonctionnalités
- Nécessite une demande d'approbation

### Academic Research (Gratuit, sur demande)
- Pour la recherche académique uniquement

## 📚 Documentation officielle

- Twitter Developer Portal : https://developer.twitter.com/
- Twitter API v2 : https://developer.twitter.com/en/docs/twitter-api
- OAuth 2.0 : https://developer.twitter.com/en/docs/authentication/oauth-2-0
- Rate Limits : https://developer.twitter.com/en/docs/rate-limits

## 🔄 Migration OAuth 1.0a → OAuth 2.0

Twitter recommande d'utiliser OAuth 2.0 pour les nouvelles apps. Si vous avez une app OAuth 1.0a :

1. Créez une nouvelle app avec OAuth 2.0
2. Migrez les credentials dans `.env`
3. Mettez à jour le code pour utiliser OAuth 2.0
4. Testez la connexion



