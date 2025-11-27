# VistaFlow - Plateforme SaaS de Gestion des Interactions Social Media

Plateforme SaaS qui automatise la gestion des interactions sur les réseaux sociaux, détecte les leads intéressés et engage des conversations automatisées pour récupérer leurs coordonnées.

## 🏗️ Architecture

- **Backend**: NestJS + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Shadcn/UI
- **Queue**: BullMQ pour les jobs asynchrones
- **IA**: OpenAI API pour la génération de messages et extraction de données

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Cloner et installer les dépendances**
```bash
npm run install:all
```

2. **Configurer Supabase (recommandé)**

Créez un projet sur [Supabase](https://supabase.com) et récupérez votre connection string :
- Allez dans Settings → Database
- Copiez la "Connection string" (URI)

3. **Configurer les variables d'environnement**

Backend (`backend/.env`):
```env
# Supabase PostgreSQL (recommandé)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
SHADOW_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Redis (local ou Upstash)
REDIS_URL="redis://localhost:6379"

# Autres variables
JWT_SECRET="your-secret-key"
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
OPENAI_API_KEY="your-openai-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Alternative: Base de données locale (Docker)**
```bash
docker-compose --profile local-db up -d
```
Puis utilisez dans `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vistaflow"
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_META_APP_ID="your-meta-app-id"
```

4. **Initialiser la base de données**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **Démarrer les serveurs**
```bash
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## 📋 Fonctionnalités MVP

- ✅ Authentification multi-tenant
- ✅ Connexion Instagram (Meta Graph API)
- ✅ Collecte automatique des interactions (likes, commentaires, follows)
- ✅ Scoring d'intérêt des utilisateurs
- ✅ Envoi automatique de DM avec templates
- ✅ Détection de numéro de téléphone
- ✅ Dashboard des leads
- ✅ Export CSV + Intégration Google Sheets

## 🔐 Sécurité

- Tokens OAuth stockés de manière chiffrée
- Rate limiting par compte social
- Respect des quotas des APIs officielles
- Validation stricte des entrées utilisateur

## 📚 Documentation API

Voir `/backend/README.md` pour la documentation complète de l'API.

