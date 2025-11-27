# 🚀 Déploiement sur Vercel - Guide Complet

## 📋 Prérequis

1. Compte Vercel : https://vercel.com/signup
2. GitHub/GitLab/Bitbucket : Votre code doit être sur un repo Git
3. Node.js installé localement (pour les tests)

---

## 📦 Étape 1 : Préparer le Frontend

### 1.1 Vérifier la configuration Next.js

Votre `frontend/package.json` doit avoir :
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### 1.2 Créer `vercel.json` (optionnel)

Créez `vercel.json` à la racine du projet :

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://votre-backend-url.com/:path*"
    }
  ]
}
```

---

## 📋 Étape 2 : Déployer le Frontend sur Vercel

### 2.1 Via l'interface Vercel

1. Allez sur https://vercel.com/new
2. Importez votre repo GitHub/GitLab/Bitbucket
3. Configurez le projet :
   - **Framework Preset** : Next.js
   - **Root Directory** : `frontend` (si votre frontend est dans un sous-dossier)
   - **Build Command** : `npm run build` (ou `cd frontend && npm run build`)
   - **Output Directory** : `.next` (ou `frontend/.next`)

### 2.2 Via CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Aller dans le dossier frontend
cd frontend

# Déployer
vercel

# Pour la production
vercel --prod
```

---

## 🔐 Étape 3 : Configurer les Variables d'Environnement

Dans le dashboard Vercel → Votre projet → **Settings** → **Environment Variables**, ajoutez :

### Variables Frontend (NEXT_PUBLIC_*)

```env
# API Backend
NEXT_PUBLIC_API_URL=https://votre-backend-url.com

# Meta (Instagram/Facebook)
NEXT_PUBLIC_META_APP_ID=votre_meta_app_id

# URLs de redirection OAuth (production)
NEXT_PUBLIC_OAUTH_REDIRECT_BASE=https://flowia.com
```

### ⚠️ Important
- Les variables `NEXT_PUBLIC_*` sont exposées au client
- Ne mettez JAMAIS de secrets dans `NEXT_PUBLIC_*`
- Utilisez des variables différentes pour dev/prod

---

## 🌐 Étape 4 : Configurer le Domaine

### 4.1 Ajouter un domaine personnalisé

1. Vercel Dashboard → Votre projet → **Settings** → **Domains**
2. Ajoutez votre domaine : `flowia.com`
3. Suivez les instructions DNS :
   - Ajoutez un enregistrement CNAME pointant vers `cname.vercel-dns.com`
   - Ou un enregistrement A pointant vers l'IP de Vercel

### 4.2 SSL automatique

Vercel configure automatiquement le SSL (HTTPS) pour votre domaine.

---

## 🔄 Étape 5 : Mettre à Jour les URLs OAuth

Après le déploiement, mettez à jour les URLs de redirection OAuth dans :

### 5.1 Meta (Instagram/Facebook)

1. Allez sur https://developers.facebook.com/
2. Votre app → **Settings** → **Basic**
3. Ajoutez dans **Valid OAuth Redirect URIs** :
   ```
   https://flowia.com/auth/meta/callback
   ```

### 5.2 TikTok

1. Allez sur https://developers.tiktok.com/
2. Votre app → **Settings**
3. Ajoutez dans **Redirect URIs** :
   ```
   https://flowia.com/auth/tiktok/callback
   ```

### 5.3 Twitter

1. Allez sur https://developer.twitter.com/
2. Votre app → **User authentication settings**
3. Ajoutez dans **Callback URI / Redirect URL** :
   ```
   https://flowia.com/auth/twitter/callback
   ```

---

## 🖥️ Étape 6 : Déployer le Backend

Vercel peut héberger des fonctions serverless, mais pour un backend NestJS complet, vous avez plusieurs options :

### Option 1 : Vercel Serverless Functions (Recommandé pour API simples)

Créez `api/` dans votre projet et convertissez vos routes en fonctions serverless.

### Option 2 : Railway (Recommandé)

1. Allez sur https://railway.app/
2. Créez un nouveau projet
3. Connectez votre repo GitHub
4. Configurez :
   - **Build Command** : `cd backend && npm install && npm run build`
   - **Start Command** : `cd backend && npm run start:prod`
   - **Port** : `3001`

### Option 3 : Render

1. Allez sur https://render.com/
2. Créez un nouveau **Web Service**
3. Connectez votre repo
4. Configurez :
   - **Build Command** : `cd backend && npm install && npm run build`
   - **Start Command** : `cd backend && npm run start:prod`

### Option 4 : Heroku

1. Allez sur https://heroku.com/
2. Créez une nouvelle app
3. Déployez via Git :
   ```bash
   heroku create votre-app-backend
   cd backend
   git subtree push --prefix backend heroku main
   ```

### Option 5 : DigitalOcean App Platform

1. Allez sur https://cloud.digitalocean.com/
2. Créez une nouvelle app
3. Connectez votre repo
4. Configurez le build et le start

---

## 🔧 Étape 7 : Variables d'Environnement Backend

Sur votre plateforme d'hébergement backend, configurez toutes les variables de `backend/.env` :

```env
# Backend General
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://flowia.com
FRONTEND_URLS=https://flowia.com,https://www.flowia.com

# Database (Supabase)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# Redis
REDIS_HOST=...
REDIS_PORT=6379

# JWT
JWT_SECRET=votre_secret_jwt_production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Meta
META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://flowia.com/auth/meta/callback
META_VERIFY_TOKEN=...

# TikTok
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://flowia.com/auth/tiktok/callback

# Twitter
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_REDIRECT_URI=https://flowia.com/auth/twitter/callback

# Google/YouTube
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://flowia.com/auth/google/callback

# LinkedIn (si headless browser)
LINKEDIN_EMAIL=...
LINKEDIN_PASSWORD=... (⚠️ Ne pas stocker en clair, utiliser un service de secrets)

# CRM
NOTION_API_KEY=...
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY=...
```

---

## 📝 Étape 8 : Mettre à Jour les URLs dans le Code

### 8.1 Frontend

Vérifiez que `frontend/.env.local` ou les variables Vercel contiennent :

```env
NEXT_PUBLIC_API_URL=https://votre-backend-url.com
```

### 8.2 Backend

Vérifiez que `FRONTEND_URL` pointe vers votre domaine Vercel :

```env
FRONTEND_URL=https://flowia.com
FRONTEND_URLS=https://flowia.com,https://www.flowia.com
```

---

## 🔄 Étape 9 : Déploiement Automatique

### 9.1 GitHub Actions (Optionnel)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 9.2 Vercel Git Integration

Vercel se connecte automatiquement à votre repo et déploie à chaque push sur `main`.

---

## ✅ Étape 10 : Vérifier le Déploiement

1. **Frontend** : Visitez `https://flowia.com`
2. **Backend** : Testez `https://votre-backend-url.com/health` (si vous avez un endpoint health)
3. **OAuth** : Testez la connexion Instagram/TikTok/Twitter
4. **Logs** : Vérifiez les logs dans Vercel Dashboard → **Deployments** → Votre déploiement → **Logs**

---

## 🐛 Problèmes Courants

### "Build failed"
- Vérifiez les logs dans Vercel Dashboard
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `npm install` fonctionne localement

### "Environment variables not found"
- Vérifiez que les variables sont bien configurées dans Vercel Dashboard
- Vérifiez que les noms correspondent exactement (case-sensitive)

### "CORS error"
- Vérifiez que `FRONTEND_URL` dans le backend correspond à votre domaine Vercel
- Vérifiez que CORS est bien configuré dans `backend/src/main.ts`

### "OAuth redirect URI mismatch"
- Vérifiez que les URLs de redirection dans les apps OAuth correspondent exactement
- Pas d'espace, pas de slash final
- `https://flowia.com/auth/meta/callback` (pas `https://flowia.com/auth/meta/callback/`)

### "Database connection failed"
- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que Supabase autorise les connexions depuis l'IP de votre hébergeur
- Vérifiez que le firewall Supabase est configuré

---

## 🔒 Sécurité en Production

1. ✅ Utilisez HTTPS partout (automatique avec Vercel)
2. ✅ Ne commitez JAMAIS `.env` dans Git
3. ✅ Utilisez des secrets différents pour dev/prod
4. ✅ Activez les rate limits
5. ✅ Configurez les CORS correctement
6. ✅ Utilisez des JWT secrets forts
7. ✅ Activez les logs et monitoring

---

## 📊 Monitoring

### Vercel Analytics

Activez Vercel Analytics dans le dashboard pour suivre les performances.

### Logs

- **Frontend** : Vercel Dashboard → **Deployments** → **Logs**
- **Backend** : Logs de votre plateforme d'hébergement

---

## 🚀 Commandes Utiles

```bash
# Déployer en preview
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls

# Ajouter une variable
vercel env add VARIABLE_NAME
```

---

## 📚 Ressources

- Vercel Documentation : https://vercel.com/docs
- Next.js Deployment : https://nextjs.org/docs/deployment
- Vercel CLI : https://vercel.com/docs/cli



