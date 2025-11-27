# 🏗️ Architecture Backend Flow IA

## Vue d'ensemble

Le backend Flow IA est une API NestJS qui orchestre les interactions avec les réseaux sociaux, traite les messages via IA, et synchronise avec les CRMs.

---

## 📦 Modules Principaux

### A) Authentification (`auth/`)

**Responsabilités:**
- Création/Login utilisateur (email + mdp ou OAuth)
- Génération JWT avec ID utilisateur
- Middleware de protection des routes
- Gestion des sessions

**Routes:**
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `POST /auth/me` - Infos utilisateur (protégé)
- `GET /auth/refresh` - Rafraîchir le token

**Sécurité:**
- Hashage bcrypt pour les mots de passe
- JWT avec expiration
- Rate limiting sur les routes d'auth

---

### B) Connexion Réseaux Sociaux (`social-accounts/`)

#### TikTok Provider (`providers/tiktok.service.ts`)

**Implémentation:**
- OAuth2 flow complet
- Stockage `access_token` + `refresh_token` (chiffré AES-256)
- Refresh automatique des tokens

**Routes:**
- `GET /social-accounts/tiktok/auth-url` - URL d'authentification
- `GET /social-accounts/tiktok/callback` - Callback OAuth
- `GET /social-accounts/tiktok/interactions` - Récupérer interactions
- `GET /social-accounts/tiktok/comments` - Récupérer commentaires
- `POST /social-accounts/tiktok/send-message` - Envoyer DM

#### Meta Provider (`providers/meta.service.ts`)

**Implémentation:**
- OAuth2 Meta Graph API
- Webhook Meta pour recevoir les événements
- Gestion des permissions (Instagram, Facebook Pages)

**Routes:**
- `GET /social-accounts/meta/auth-url` - URL d'authentification
- `GET /social-accounts/meta/callback` - Callback OAuth
- `POST /social-accounts/meta/webhook` - Webhook Meta
- `POST /social-accounts/meta/send-dm` - Envoyer DM
- `GET /social-accounts/meta/messages` - Lire DM

**Webhook Events:**
- `messages` - Nouveau message reçu
- `messaging_postbacks` - Actions utilisateur
- `message_reads` - Message lu

#### YouTube Provider (`providers/youtube.service.ts`)

**Implémentation:**
- OAuth2 Google (YouTube Data API v3)
- Récupération commentaires et activités
- Stockage tokens + refresh automatique

**Routes:**
- `GET /social-accounts/youtube/auth-url` - URL d'authentification
- `GET /social-accounts/youtube/callback` - Callback OAuth
- `GET /social-accounts/youtube/comments` - Récupérer commentaires
- `GET /social-accounts/youtube/activities` - Récupérer activités

#### LinkedIn Provider (`providers/linkedin.service.ts`)

**Implémentation:**
- Headless browser (Playwright)
- Récupération cookies après login manuel
- Stockage cookies cryptés
- Services Playwright pour DM

**Routes:**
- `POST /social-accounts/linkedin/connect` - Connecter compte (upload cookies)
- `GET /social-accounts/linkedin/messages` - Lire DM
- `POST /social-accounts/linkedin/send-message` - Envoyer DM
- `GET /social-accounts/linkedin/conversations` - Liste conversations

**Services Playwright:**
- `readDm()` - Lire un message
- `sendDm()` - Envoyer un message
- `detectNewMessages()` - Détecter nouveaux messages
- `classifyConversations()` - Classer conversations

---

### C) Message Processing Engine (`message-processing/`)

**Le cerveau du backend.**

**Flux de traitement:**

1. **Réception** (`message-processor.service.ts`)
   - Webhook Meta → Queue `incomingMessages`
   - LinkedIn polling → Queue `incomingMessages`
   - TikTok API → Queue `incomingMessages`

2. **Vérification Plan** (`plan-checker.service.ts`)
   - Vérifier plan utilisateur (Freemium/Premium/Ultra)
   - Appliquer limites selon plan
   - Bloquer si quota dépassé

3. **Application Scénario** (`scenario-engine.service.ts`)
   - Charger scénario configuré par utilisateur
   - Décider: réponse auto / relance auto / qualification IA
   - Générer réponse via AI Engine

4. **Décision** (`decision-engine.service.ts`)
   - Analyser contexte conversation
   - Vérifier règles métier
   - Décider d'envoyer ou non

5. **Logging** (`interaction-logger.service.ts`)
   - Logger toutes les interactions
   - Stocker dans DB
   - Métriques pour analytics

6. **CRM Sync** (`crm-sync.service.ts`)
   - Si activé, envoyer au CRM
   - Notion / Airtable / Google Sheets

**Queue: `incomingMessages`**
- Concurrency: 5
- Retry: 3 tentatives
- Timeout: 30s

---

### D) AI Engine (`ai/`)

**Service OpenAI** (`openai.service.ts`)

**Prompts configurés:**

1. **Répondre à un message** (`generateReply()`)
   ```
   Tu es un assistant commercial pour [entreprise].
   Réponds à ce message de manière professionnelle et engageante.
   Message: {message}
   Contexte: {context}
   ```

2. **Extraire un numéro** (`extractPhoneNumber()`)
   ```
   Extrais le numéro de téléphone de ce texte.
   Texte: {text}
   Format: +33XXXXXXXXX
   ```

3. **Classer un prospect** (`classifyProspect()`)
   ```
   Classe ce prospect selon son niveau d'intérêt (hot/warm/cold).
   Conversation: {conversation}
   ```

4. **Générer une relance** (`generateFollowUp()`)
   ```
   Génère une relance pour ce prospect.
   Dernier message: {lastMessage}
   Jours depuis dernier contact: {days}
   ```

5. **Résumer une conversation** (`summarizeConversation()`)
   ```
   Résume cette conversation en 3 points clés.
   Conversation: {conversation}
   ```

**Limites:**
- Rate limiting: 60 req/min
- Token limit: 4000 tokens par requête
- Pas de flood: max 1 message/5min par conversation

---

### E) Billing (Stripe) (`billing/`)

**Plans:**
- **Freemium**: 0€ - Fonctionnalités limitées
- **Premium**: 14,99€/mois - Plan volume
- **Ultra**: 29,99€/mois ou 299€/an - Plan complet

**Webhooks Stripe** (`stripe-webhook.controller.ts`):

1. `customer.subscription.updated`
   - Mettre à jour plan utilisateur
   - Activer/désactiver fonctionnalités

2. `invoice.paid`
   - Confirmer paiement
   - Activer accès

3. `customer.deleted`
   - Désactiver compte
   - Archiver données

**Routes:**
- `POST /billing/create-checkout` - Créer session checkout
- `POST /billing/create-portal` - Gérer abonnement
- `POST /billing/webhook` - Webhook Stripe

**Service** (`billing.service.ts`):
- `checkPlanLimits()` - Vérifier limites plan
- `upgradePlan()` - Changer de plan
- `cancelSubscription()` - Annuler abonnement

---

### F) CRM Integrations (`integrations/`)

#### Notion (`notion.service.ts`)
- Création de page via API
- Mapping données → format Notion
- Gestion erreurs et retry

#### Airtable (`airtable.service.ts`)
- POST row via API
- Mapping données → format Airtable
- Gestion erreurs et retry

#### Google Sheets (`google-sheets.service.ts`)
- Append row via API
- Service Account authentication
- Gestion erreurs et retry

**Routes:**
- `POST /integrations/notion/sync` - Sync vers Notion
- `POST /integrations/airtable/sync` - Sync vers Airtable
- `POST /integrations/google-sheets/sync` - Sync vers Google Sheets
- `GET /integrations/config` - Configuration intégrations

---

### G) Queue System (`queues/`)

**Redis + BullMQ**

**3 Queues principales:**

1. **`incomingMessages`**
   - Traitement messages entrants
   - Concurrency: 5
   - Processor: `incoming-messages.processor.ts`

2. **`autoReply`**
   - Envoi réponses automatiques
   - Concurrency: 3
   - Processor: `auto-reply.processor.ts`

3. **`browserLinkedIn`**
   - Actions Playwright LinkedIn
   - Concurrency: 2
   - Processor: `browser-linkedin.processor.ts`

**Configuration:**
- Redis connection pooling
- Retry avec backoff exponentiel
- Dead letter queue pour échecs

---

### H) Logs & Sécurité (`security/`)

#### Logging (`logger.service.ts`)
- Logger toutes les actions
- Niveaux: error, warn, info, debug
- Rotation des logs
- Export vers service externe (optionnel)

#### Encryption (`encryption.service.ts`)
- AES-256-GCM pour tokens OAuth
- Clé stockée dans `ENCRYPTION_KEY`
- IV unique par encryption

#### Rate Limiting (`rate-limit.guard.ts`)
- 100 req/min par ID utilisateur
- Redis pour compteur distribué
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

#### Quota Management (`quota.service.ts`)
- Vérification quotas utilisateurs
- Limites selon plan:
  - Freemium: 10 DM/jour
  - Premium: 100 DM/jour
  - Ultra: Illimité

---

## 🔄 Flux de Données

### 1. Réception Message

```
Webhook Meta → Queue incomingMessages → Message Processor → 
Plan Checker → Scenario Engine → AI Engine → Decision Engine → 
Queue autoReply → Envoi DM → CRM Sync → Logging
```

### 2. Connexion Réseau Social

```
User → OAuth Flow → Provider Service → Encryption → DB → 
Webhook Setup (si Meta) → Ready
```

### 3. Billing

```
Stripe Webhook → Billing Service → Plan Update → 
Feature Activation → User Notification
```

---

## 🗄️ Base de Données (Prisma)

**Modèles principaux:**
- `User` - Utilisateurs
- `Workspace` - Espaces de travail
- `SocialAccount` - Comptes sociaux connectés
- `InteractionEvent` - Événements d'interaction
- `DmSequence` - Séquences de messages
- `Lead` - Prospects qualifiés
- `Subscription` - Abonnements Stripe
- `Integration` - Configurations CRM
- `Quota` - Quotas utilisateurs

---

## 🚀 Déploiement

**Recommandé:**
- Backend: Render / Fly.io / Railway
- Database: Supabase
- Redis: Upstash
- Queue: BullMQ (via Redis)

**Variables d'environnement:**
Voir `.env.example` pour la liste complète.

---

## 📊 Monitoring

- Logs centralisés (Winston)
- Métriques Prometheus (optionnel)
- Health checks: `GET /health`
- Queue monitoring: Bull Board (optionnel)

---

## 🔐 Sécurité

- JWT pour authentification
- AES-256 pour tokens OAuth
- Rate limiting
- CORS configuré
- Validation des inputs (class-validator)
- Helmet pour headers sécurité



