# VistaFlow Backend

API backend pour VistaFlow - Plateforme SaaS de gestion des interactions social media.

## 🚀 Démarrage

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Initialiser la base de données**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Démarrer le serveur**
```bash
npm run start:dev
```

Le serveur sera accessible sur http://localhost:3001

## 📚 Structure du projet

```
src/
├── auth/              # Authentification (JWT, login, register)
├── users/             # Gestion des utilisateurs
├── workspaces/        # Workspaces multi-tenant
├── social-accounts/   # Comptes sociaux connectés (Instagram, TikTok, etc.)
├── interactions/      # Collecte des interactions
├── targets/           # Scoring et détection de leads ciblables
├── dm/                # Envoi de messages privés
├── leads/             # Gestion des leads
├── integrations/      # Intégrations (Google Sheets, Notion, Webhooks)
├── jobs/              # Tâches planifiées (cron jobs)
└── prisma/            # Service Prisma
```

## 🔌 API Endpoints

### Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/me` - Informations utilisateur (protégé)

### Workspaces
- `GET /workspaces` - Liste des workspaces
- `POST /workspaces` - Créer un workspace
- `GET /workspaces/:id` - Détails d'un workspace

### Comptes sociaux
- `GET /social-accounts/instagram/auth-url` - URL d'authentification Instagram
- `GET /social-accounts/instagram/callback` - Callback OAuth
- `GET /social-accounts/workspace/:workspaceId` - Liste des comptes

### Interactions
- `POST /interactions/collect/:accountId` - Collecter les interactions
- `GET /interactions/workspace/:workspaceId` - Liste des interactions

### Targets
- `POST /targets/update/:workspaceId` - Mettre à jour les scores
- `GET /targets/workspace/:workspaceId` - Liste des targets

### DM
- `GET /dm/templates/:workspaceId` - Templates de messages
- `POST /dm/send` - Envoyer un DM
- `GET /dm/sequences/:workspaceId` - Historique des séquences

### Leads
- `GET /leads/workspace/:workspaceId` - Liste des leads
- `GET /leads/:id` - Détails d'un lead
- `PUT /leads/:id/status` - Mettre à jour le statut
- `GET /leads/export/csv/:workspaceId` - Export CSV

### Intégrations
- `GET /integrations/workspace/:workspaceId` - Liste des intégrations
- `POST /integrations/workspace/:workspaceId` - Créer une intégration

## 🔄 Jobs planifiés

- **Collecte des interactions** : Toutes les 15 minutes
- **Mise à jour des scores** : Toutes les heures
- **Réinitialisation des quotas** : Tous les jours à minuit

## 🔐 Sécurité

- Tokens OAuth chiffrés avec AES-256-GCM
- Rate limiting par compte social
- Validation des entrées avec class-validator
- JWT pour l'authentification

## 📝 Notes

- Les tokens Instagram nécessitent un compte Business
- Les quotas par défaut sont de 50 DM/jour par compte
- Le scoring d'intérêt va de 0 à 100

