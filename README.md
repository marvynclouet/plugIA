# VistaFlow - Plateforme SaaS de Gestion Automatisée des Interactions Social Media

> **Flow.IA** : Automatisation intelligente de la détection de leads et de l'engagement sur les réseaux sociaux avec IA

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/)

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Configuration](#configuration)
- [Services & Modules](#services--modules)
- [Pipeline IA](#pipeline-ia)
- [Jobs Automatiques](#jobs-automatiques)
- [API Endpoints](#api-endpoints)
- [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

**VistaFlow** est une plateforme SaaS complète qui automatise la gestion des interactions sur les réseaux sociaux. Le système détecte automatiquement les leads intéressés, analyse leurs intentions avec l'IA, et engage des conversations automatisées pour récupérer leurs coordonnées.

### ✨ Points clés

- 🤖 **Automatisation complète** : Scraping, analyse, et engagement automatisés
- 🧠 **Intelligence Artificielle** : Classification de leads, scoring, et génération de messages personnalisés
- 🔄 **Reconnexion automatique** : Gestion intelligente des sessions expirées
- 🛡️ **Comportement humain** : Délais aléatoires, mouvements de souris, frappe caractère par caractère
- 📊 **Multi-plateformes** : TikTok, Instagram (Meta), et extensible à d'autres
- 🔐 **Sécurité renforcée** : Chiffrement des tokens, rate limiting, validation de sessions

---

## 🏗️ Architecture

### Stack technique

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14 (App Router) + Tailwind CSS + Shadcn/UI         │
│  - Dashboard interactif                                      │
│  - Connexion TikTok (QR Code + Cookies)                     │
│  - Gestion des leads et interactions                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  NestJS + TypeScript + Prisma ORM                           │
│  - API RESTful                                               │
│  - Jobs Cron (ScheduleModule)                                │
│  - Queue System (BullMQ - optionnel)                        │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │   OpenAI     │
│  (Supabase)  │    │  (Optionnel) │    │     API      │
└──────────────┘    └──────────────┘    └──────────────┘
         ↕
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATION LAYER                                │
│  Playwright (Headless Browser)                              │
│  - Scraping TikTok Inbox                                    │
│  - Envoi de DM automatisé                                   │
│  - Gestion de sessions persistantes                         │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données

```
1. Connexion TikTok (QR Code ou Cookies)
   ↓
2. Scraping automatique de l'inbox (toutes les 3 min)
   ↓
3. Extraction des interactions (likes, comments, follows, DM)
   ↓
4. Analyse IA des leads (classification + scoring)
   ↓
5. Extraction d'informations (téléphone, email, intentions)
   ↓
6. Génération de messages personnalisés
   ↓
7. Envoi automatique de DM (avec rate limiting)
   ↓
8. Détection de réponses et mise à jour des leads
```

---

## 📁 Structure du projet

```
VistaFlow/
├── backend/                          # API NestJS
│   ├── src/
│   │   ├── app.module.ts            # Module principal
│   │   ├── main.ts                  # Point d'entrée
│   │   │
│   │   ├── auth/                    # Authentification JWT
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── strategies/
│   │   │
│   │   ├── social-accounts/         # Gestion des comptes sociaux
│   │   │   ├── social-accounts.controller.ts
│   │   │   ├── social-accounts.service.ts
│   │   │   └── providers/
│   │   │       ├── social-connection.service.ts      # Service unifié de connexion
│   │   │       ├── tiktok-qr-connection.service.ts   # Connexion QR Code TikTok
│   │   │       ├── tiktok-browser.service.ts          # Automatisation Playwright
│   │   │       ├── tiktok-inbox.service.ts            # Scraping inbox
│   │   │       ├── tiktok-inbox-sync.service.ts       # Job de synchronisation
│   │   │       ├── tiktok-reconnection.service.ts     # Reconnexion automatique
│   │   │       ├── tiktok-rate-limiter.service.ts    # Rate limiting
│   │   │       ├── tiktok-session-manager.service.ts  # Gestion sessions
│   │   │       ├── tiktok-ai-agent.service.ts         # Agent IA TikTok
│   │   │       ├── tiktok-cookies.service.ts          # Parsing cookies
│   │   │       ├── instagram.service.ts               # Instagram (Meta API)
│   │   │       └── facebook.service.ts                # Facebook (Meta API)
│   │   │
│   │   ├── leads/                   # Gestion des leads
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── lead-analysis.service.ts      # Analyse IA des leads
│   │   │   └── lead-extraction.service.ts    # Extraction téléphone/email
│   │   │
│   │   ├── interactions/            # Gestion des interactions
│   │   │   ├── interactions.controller.ts
│   │   │   └── interactions.service.ts
│   │   │
│   │   ├── dm/                      # Envoi de DM
│   │   │   ├── dm.controller.ts
│   │   │   ├── dm.service.ts
│   │   │   └── dm.processor.ts      # Queue processor (BullMQ)
│   │   │
│   │   ├── jobs/                    # Jobs récurrents
│   │   │   └── jobs.service.ts      # Orchestration des cron jobs
│   │   │
│   │   ├── targets/                 # Cibles (utilisateurs suivis)
│   │   ├── workspaces/              # Workspaces multi-tenant
│   │   ├── users/                   # Gestion utilisateurs
│   │   ├── integrations/            # Intégrations externes
│   │   ├── prisma/                  # Service Prisma
│   │   └── utils/                   # Utilitaires
│   │       └── cookie-parser.ts     # Parser intelligent de cookies
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # Schéma de base de données
│   │   └── migrations/               # Migrations Prisma
│   │
│   └── sessions/                    # Sessions Playwright (stockage local)
│
├── frontend/                        # Application Next.js
│   ├── app/
│   │   ├── dashboard/               # Dashboard principal
│   │   │   ├── accounts/            # Gestion des comptes
│   │   │   │   └── tiktok-connect-dialog.tsx  # Dialog connexion TikTok
│   │   │   ├── leads/               # Liste des leads
│   │   │   ├── interactions/        # Historique interactions
│   │   │   └── integrations/        # Intégrations
│   │   ├── auth/                    # Pages d'authentification
│   │   │   └── tiktok/              # Callbacks TikTok
│   │   └── legal/                   # Pages légales
│   │
│   ├── components/
│   │   ├── ui/                      # Composants Shadcn/UI
│   │   └── navbar.tsx
│   │
│   └── lib/
│       ├── api.ts                   # Client API
│       └── auth.ts                  # Utilitaires auth
│
├── docker-compose.yml               # Configuration Docker
└── vercel.json                      # Configuration Vercel
```

---

## 🚀 Fonctionnalités

### 1. 🔐 Authentification & Multi-tenant

- ✅ Authentification JWT avec refresh tokens
- ✅ Système de workspaces (multi-tenant)
- ✅ Gestion des rôles (owner, admin, member)
- ✅ Connexion Google OAuth

### 2. 📱 Connexion TikTok

#### Méthode 1 : QR Code (Recommandée)
- Génération automatique de QR code
- Polling en temps réel du statut de connexion
- Extraction automatique des cookies après scan
- Interface utilisateur intuitive

#### Méthode 2 : Cookies manuels
- Parser intelligent de cookies (format DevTools, JSON, etc.)
- Support multi-domaines (tiktok.com, www.tiktok.com, m.tiktok.com)
- Validation et formatage automatique

### 3. 🤖 Scraping Automatique

- **Job Cron** : Toutes les 3 minutes
- Extraction de toutes les interactions :
  - ❤️ Likes
  - 💬 Commentaires
  - 👥 Follows/Unfollows
  - 📨 Messages directs (DM)
  - 🔔 Notifications
- Détection automatique de doublons
- Gestion des sessions expirées

### 4. 🧠 Pipeline IA

#### Analyse des Leads
- **Classification automatique** :
  - `artist` : Artiste créateur de contenu
  - `beatmaker` : Producteur musical
  - `client_potentiel` : Client intéressé
  - `curieux` : Utilisateur curieux
  - `spam` : Spam à ignorer
- **Scoring d'intérêt** : 0-100
- **Génération de messages personnalisés** basés sur :
  - Type de lead
  - Historique d'interactions
  - Contenu des messages précédents

#### Extraction d'informations
- Détection de **numéros de téléphone** (formats internationaux)
- Détection d'**emails**
- Détection d'**intentions** :
  - `prix` : Demande de prix
  - `interesse` : Intérêt exprimé
  - `achat` : Intention d'achat
  - `info` : Demande d'informations

### 5. 📨 Envoi de DM Automatisé

- **Comportement humain** :
  - Délais aléatoires entre actions
  - Mouvement de souris avant clic
  - Frappe caractère par caractère
- **Rate limiting** :
  - 10 DM/heure par compte
  - 50 DM/jour par compte
  - 30 actions/heure (général)
- **Validation de session** avant chaque envoi
- **Gestion d'erreurs** robuste

### 6. 🔄 Reconnexion Automatique

- Détection des sessions expirées
- Génération automatique de QR code
- Job Cron toutes les heures
- Mise à jour automatique des cookies
- Notification des utilisateurs

### 7. 📊 Dashboard & Analytics

- Vue d'ensemble des leads
- Filtres par statut, type, score
- Historique des interactions
- Export CSV
- Intégration Google Sheets

### 8. 🔗 Intégrations

- **Instagram** : Via Meta Graph API
- **TikTok** : Via Playwright (scraping)
- **Extensible** : Architecture modulaire pour ajouter d'autres plateformes

---

## 🛠️ Installation

### Prérequis

- Node.js 18+
- PostgreSQL 15+ (ou Supabase)
- Redis 7+ (optionnel, pour BullMQ)
- Docker & Docker Compose (optionnel)

### 1. Cloner le projet

```bash
git clone https://github.com/marvynclouet/plugIA.git
cd plugIA
```

### 2. Installer les dépendances

```bash
npm run install:all
```

### 3. Configuration de la base de données

#### Option A : Supabase (Recommandé)

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez votre connection string :
   - Settings → Database → Connection string (URI)
3. Utilisez cette URL dans `backend/.env`

#### Option B : Docker (Local)

```bash
docker-compose --profile local-db up -d
```

### 4. Variables d'environnement

#### Backend (`backend/.env`)

```env
# Base de données
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
SHADOW_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Redis (optionnel - mettre false pour désactiver)
REDIS_ENABLED=false
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# OpenAI (pour l'IA)
OPENAI_API_KEY="sk-..."

# Meta (Instagram/Facebook)
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Playwright (optionnel)
PLAYWRIGHT_DEBUG=false
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_META_APP_ID="your-meta-app-id"
```

### 5. Initialiser la base de données

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 6. Démarrer les serveurs

```bash
# Depuis la racine
npm run dev

# Ou séparément :
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

- **Backend** : http://localhost:3001
- **Frontend** : http://localhost:3000

---

## 🔧 Configuration

### Désactiver Redis

Si vous ne voulez pas utiliser Redis (BullMQ), ajoutez dans `backend/.env` :

```env
REDIS_ENABLED=false
```

Le système fonctionnera sans Redis, mais les queues asynchrones seront désactivées.

### Playwright Debug Mode

Pour activer les screenshots de debug :

```env
PLAYWRIGHT_DEBUG=true
```

Les screenshots seront sauvegardés dans `backend/sessions/debug/`.

---

## 📦 Services & Modules

### Backend Services

#### `TikTokBrowserService`
Service principal pour l'automatisation Playwright :
- Validation de sessions
- Navigation et interaction avec TikTok
- Envoi de DM avec comportement humain
- Gestion des cookies

#### `TikTokQRConnectionService`
Gestion de la connexion QR Code :
- Génération de QR code
- Polling du statut de connexion
- Extraction automatique des cookies

#### `TikTokInboxService`
Scraping de l'inbox TikTok :
- Navigation vers `/inbox`
- Scroll automatique
- Extraction des interactions
- Parsing des timestamps

#### `TikTokInboxSyncService`
Job Cron pour synchroniser les inboxes :
- Exécution toutes les 3 minutes
- Traitement de tous les comptes actifs
- Déclenchement de l'analyse IA

#### `TikTokReconnectionService`
Reconnexion automatique :
- Détection des sessions expirées
- Génération de QR code
- Mise à jour des cookies

#### `TikTokRateLimiterService`
Rate limiting :
- Limites par compte
- Limites globales
- Tracking en mémoire

#### `LeadAnalysisService`
Analyse IA des leads :
- Classification avec OpenAI
- Scoring d'intérêt
- Génération de messages

#### `LeadExtractionService`
Extraction d'informations :
- Regex pour téléphone/email
- Détection d'intentions
- Mise à jour des leads

### Frontend Components

#### `TikTokConnectDialog`
Dialog de connexion TikTok :
- Affichage QR code
- Polling du statut
- Fallback cookies manuels
- Interface utilisateur moderne

---

## 🤖 Pipeline IA

### Flux d'analyse

```
1. Scraping Inbox (TikTokInboxSyncService)
   ↓
2. Sauvegarde des interactions en DB
   ↓
3. Déclenchement de l'analyse IA (LeadAnalysisService)
   ↓
4. Classification du lead (OpenAI GPT-4o-mini)
   ↓
5. Scoring d'intérêt (0-100)
   ↓
6. Génération de message personnalisé
   ↓
7. Extraction d'informations (LeadExtractionService)
   ↓
8. Mise à jour du lead en DB
```

### Exemple de classification

**Input** :
```
Lead: @beatmaker123
Interactions:
- Like sur 3 vidéos de beats
- Commentaire: "🔥🔥🔥"
- Follow
```

**Output IA** :
```json
{
  "leadType": "beatmaker",
  "interestScore": 85,
  "suggestedMessage": "Salut @beatmaker123 ! J'ai vu que tu aimais mes beats 🔥 Tu cherches des beats personnalisés ?",
  "confidence": 0.92
}
```

---

## ⏰ Jobs Automatiques

### Jobs Cron configurés

| Job | Fréquence | Service | Description |
|-----|-----------|---------|-------------|
| `syncAllTikTokInboxes` | Toutes les 3 min | `TikTokInboxSyncService` | Scrape toutes les inboxes TikTok actives |
| `analyzePendingLeads` | Toutes les 30 min | `LeadAnalysisService` | Analyse les leads non classifiés |
| `extractLeadsFromRecentDMs` | Toutes les heures | `LeadExtractionService` | Extrait téléphone/email des DMs récents |
| `autoReconnectExpiredSessions` | Toutes les heures | `TikTokReconnectionService` | Reconnexion automatique des sessions expirées |

### Configuration des jobs

Les jobs sont définis dans `backend/src/jobs/jobs.service.ts` :

```typescript
@Cron('0 */3 * * * *')  // Toutes les 3 minutes
async syncInboxes() {
  await this.inboxSyncService.syncAllTikTokInboxes();
}
```

---

## 🌐 API Endpoints

### Authentification

```
POST   /auth/register          # Inscription
POST   /auth/login             # Connexion
POST   /auth/refresh            # Refresh token
GET    /auth/profile           # Profil utilisateur
```

### Comptes sociaux

```
GET    /social-accounts                    # Liste des comptes
POST   /social-accounts/connect/initiate   # Initier connexion (QR/Cookies)
GET    /social-accounts/connect/status     # Statut connexion
POST   /social-accounts/connect/complete    # Finaliser connexion
DELETE /social-accounts/:id                # Supprimer compte
```

### Leads

```
GET    /leads                    # Liste des leads
GET    /leads/:id                 # Détails d'un lead
PATCH  /leads/:id/status          # Mettre à jour le statut
GET    /leads/:id/interactions    # Interactions d'un lead
```

### Interactions

```
GET    /interactions              # Liste des interactions
GET    /interactions/:id          # Détails d'une interaction
```

### DM

```
POST   /dm/send                   # Envoyer un DM
GET    /dm/status/:id             # Statut d'un DM
```

---

## 🚢 Déploiement

### Vercel (Frontend)

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Backend (Railway, Render, etc.)

1. Configurez les variables d'environnement
2. Déployez avec Docker ou directement
3. Configurez les jobs Cron (ou utilisez le ScheduleModule)

### Variables d'environnement de production

Assurez-vous de configurer :
- `DATABASE_URL` (Supabase recommandé)
- `JWT_SECRET` (généré aléatoirement)
- `OPENAI_API_KEY`
- `REDIS_URL` (si utilisé)

---

## 📝 Notes importantes

### Sécurité

- ⚠️ **Ne jamais commiter** les fichiers `.env`
- 🔐 Les tokens sont **chiffrés** en base de données
- 🛡️ **Rate limiting** activé par défaut
- ✅ **Validation** stricte des entrées utilisateur

### Limitations TikTok

- TikTok n'a pas d'API officielle, donc on utilise Playwright
- Le scraping peut être détecté si mal configuré
- Utilisez les **délais humains** et le **rate limiting**
- Les sessions peuvent expirer, d'où la reconnexion automatique

### Performance

- Les jobs Cron sont optimisés pour traiter par lots
- Le scraping est limité à 3 minutes d'intervalle minimum
- Les sessions Playwright sont réutilisées pour économiser les ressources

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

## 📄 Licence

Ce projet est sous licence propriétaire. Tous droits réservés.

---

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation dans `/docs`
- Vérifiez les logs dans `backend/logs/`

---

**Développé avec ❤️ pour automatiser votre présence sur les réseaux sociaux**
