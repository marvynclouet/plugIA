# 🚀 Guide de démarrage rapide - VistaFlow

## Prérequis

- Node.js 18+ installé
- Docker et Docker Compose installés
- Compte Meta Developer (pour Instagram)
- Clé API OpenAI (pour l'extraction de numéros)

## Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm run install:all
```

### 2. Démarrer PostgreSQL et Redis

```bash
docker-compose up -d
```

Vérifier que les conteneurs sont bien démarrés :
```bash
docker-compose ps
```

### 3. Configurer le backend

```bash
cd backend
cp .env.example .env
```

Éditer `backend/.env` avec vos valeurs :
```env
DATABASE_URL="postgresql://vistaflow:vistaflow_dev@localhost:5432/vistaflow"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="votre-secret-jwt-tres-securise"
META_APP_ID="votre-meta-app-id"
META_APP_SECRET="votre-meta-app-secret"
META_REDIRECT_URI="http://localhost:3000/auth/instagram/callback"
OPENAI_API_KEY="votre-openai-api-key"
ENCRYPTION_KEY="votre-cle-32-caracteres-pour-chiffrement"
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
2. **Connecter Instagram** :
   - Aller dans "Comptes"
   - Cliquer sur "Connecter Instagram"
   - Autoriser l'application Meta
3. **Collecter les interactions** :
   - Les interactions sont collectées automatiquement toutes les 15 minutes
   - Vous pouvez aussi déclencher manuellement via l'API : `POST /interactions/collect/:accountId`
4. **Voir les leads** :
   - Aller dans "Leads" pour voir les personnes intéressées
   - Les leads sont créés automatiquement quand un numéro de téléphone est détecté

## Configuration Meta / Instagram

1. Aller sur https://developers.facebook.com/
2. Créer une nouvelle application
3. Ajouter le produit "Instagram Basic Display" ou "Instagram Graph API"
4. Configurer les URLs de redirection OAuth
5. Récupérer l'App ID et l'App Secret

**Important** : Pour envoyer des DM, vous devez utiliser un compte Instagram Business et demander les permissions appropriées.

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

