# 🚀 Guide de démarrage rapide - VistaFlow

## Prérequis

- Node.js 18+ installé
- Docker et Docker Compose installés
- Compte Meta Developer (pour Instagram et Facebook)
- Clé API OpenAI (pour l'extraction de numéros)

## Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm run install:all
```

### 2. Configurer Supabase (recommandé)

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans **Settings → Database**
3. Copiez la **Connection string** (URI) - format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

### 3. Configurer le backend

```bash
cd backend
cp .env.example .env
```

Éditer `backend/.env` avec vos valeurs :
```env
# Supabase PostgreSQL (recommandé)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
SHADOW_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Redis (local ou Upstash)
REDIS_URL="redis://localhost:6379"

# Autres variables
JWT_SECRET="votre-secret-jwt-tres-securise"
META_APP_ID="votre-meta-app-id"
META_APP_SECRET="votre-meta-app-secret"
META_REDIRECT_URI="http://localhost:3000/auth/instagram/callback"
# Optionnel : URL de callback spécifique pour Facebook (sinon construit automatiquement)
# META_FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback"
OPENAI_API_KEY="votre-openai-api-key"
ENCRYPTION_KEY="votre-cle-32-caracteres-pour-chiffrement"
```

**Alternative: Base de données locale (Docker)**
```bash
docker-compose --profile local-db up -d
```
Puis dans `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vistaflow"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vistaflow_shadow"
```

### 4. Initialiser la base de données

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Configurer le frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

Éditer `frontend/.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_META_APP_ID=votre-meta-app-id
```

### 6. Démarrer les serveurs

Dans un terminal :
```bash
# Backend
cd backend
npm run start:dev
```

Dans un autre terminal :
```bash
# Frontend
cd frontend
npm run dev
```

## Accès

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Prisma Studio** : `cd backend && npx prisma studio`

## Premiers pas

1. **Créer un compte** sur http://localhost:3000/login
2. **Connecter vos réseaux sociaux** :
   - Aller dans "Comptes"
   - Cliquer sur "Connecter Instagram" ou "Connecter Facebook"
   - Autoriser l'application Meta
   - Pour Facebook, vous pourrez choisir les Pages à connecter
3. **Collecter les interactions** :
   - Les interactions sont collectées automatiquement toutes les 15 minutes
   - Vous pouvez aussi déclencher manuellement via l'API : `POST /interactions/collect/:accountId`
4. **Voir les leads** :
   - Aller dans "Leads" pour voir les personnes intéressées
   - Les leads sont créés automatiquement quand un numéro de téléphone est détecté

## Configuration Meta / Instagram / Facebook

1. Aller sur https://developers.facebook.com/
2. Créer une nouvelle application
3. Ajouter les produits :
   - **Instagram Graph API** (pour Instagram)
   - **Facebook Login** (pour Facebook)
4. Configurer les URLs de redirection OAuth :
   - Instagram : `http://localhost:3000/auth/instagram/callback` (ou votre domaine en prod)
   - Facebook : `http://localhost:3000/auth/facebook/callback` (ou votre domaine en prod)
5. Récupérer l'App ID et l'App Secret

**Important** :
- Pour Instagram : vous devez utiliser un compte Instagram Business et demander les permissions appropriées pour envoyer des DM
- Pour Facebook : vous devez avoir une Page Facebook et demander les permissions `pages_manage_posts`, `pages_messaging`, `pages_read_engagement`

## Troubleshooting

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est bien démarré : `docker-compose ps`
- Vérifier les credentials dans `.env`

### Erreur Redis
- Vérifier que Redis est démarré : `docker-compose ps`
- Vérifier la connexion : `redis-cli ping`

### Erreur OAuth Instagram
- Vérifier que les URLs de redirection correspondent exactement
- Vérifier que l'application Meta est en mode développement/test

### Erreur Prisma
- Réinitialiser la base : `npx prisma migrate reset`
- Régénérer le client : `npx prisma generate`

## Prochaines étapes

- Configurer les templates de messages DM
- Connecter d'autres plateformes (TikTok, LinkedIn, X)
- Configurer les intégrations (Google Sheets, Notion)
- Personnaliser le scoring d'intérêt

