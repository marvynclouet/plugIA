# 🗺️ Roadmap d'Implémentation Backend Flow IA

## ✅ Déjà Implémenté

- [x] Authentification JWT
- [x] Workspaces multi-tenant
- [x] Meta OAuth (Instagram/Facebook)
- [x] Collecte interactions Instagram
- [x] Scoring d'intérêt
- [x] Envoi DM automatique
- [x] Détection numéro téléphone
- [x] Dashboard leads
- [x] Export CSV
- [x] Intégrations Google Sheets / Notion (prêtes)
- [x] Queue BullMQ
- [x] Cron jobs

---

## 🚧 À Implémenter (Priorité Haute)

### 1. TikTok Provider
- [ ] OAuth2 TikTok
- [ ] Routes: auth-url, callback, interactions, comments, send-message
- [ ] Service: `tiktok.service.ts`
- [ ] Stockage tokens chiffrés

### 2. YouTube Provider
- [ ] OAuth2 Google (YouTube Data API)
- [ ] Routes: auth-url, callback, comments, activities
- [ ] Service: `youtube.service.ts`
- [ ] Stockage tokens + refresh

### 3. LinkedIn Headless Browser
- [ ] Service Playwright
- [ ] Routes: connect, messages, send-message, conversations
- [ ] Queue: `browserLinkedIn`
- [ ] Stockage cookies chiffrés
- [ ] Processor: `browser-linkedin.processor.ts`

### 4. Message Processing Engine
- [ ] Service: `message-processor.service.ts`
- [ ] Service: `plan-checker.service.ts`
- [ ] Service: `scenario-engine.service.ts`
- [ ] Service: `decision-engine.service.ts`
- [ ] Service: `interaction-logger.service.ts`
- [ ] Service: `crm-sync.service.ts`
- [ ] Queue: `incomingMessages`

### 5. AI Engine Amélioré
- [ ] Service: `openai.service.ts` avec tous les prompts
- [ ] `generateReply()` - Répondre à un message
- [ ] `extractPhoneNumber()` - Extraire numéro
- [ ] `classifyProspect()` - Classer prospect
- [ ] `generateFollowUp()` - Générer relance
- [ ] `summarizeConversation()` - Résumer conversation
- [ ] Rate limiting OpenAI

### 6. Billing Stripe
- [ ] Module: `billing/`
- [ ] Service: `billing.service.ts`
- [ ] Controller: `billing.controller.ts`
- [ ] Webhook: `stripe-webhook.controller.ts`
- [ ] Plans: Freemium, Premium (14,99€), Ultra (29,99€)
- [ ] Routes: create-checkout, create-portal, webhook

### 7. Webhook Meta
- [ ] Route: `POST /social-accounts/meta/webhook`
- [ ] Vérification `META_VERIFY_TOKEN`
- [ ] Traitement événements: messages, messaging_postbacks, message_reads
- [ ] Envoi vers queue `incomingMessages`

### 8. Sécurité & Rate Limiting
- [ ] Guard: `rate-limit.guard.ts`
- [ ] Service: `quota.service.ts`
- [ ] Vérification quotas selon plan
- [ ] Limites: Freemium (10 DM/jour), Premium (100 DM/jour), Ultra (illimité)

---

## 📋 À Implémenter (Priorité Moyenne)

### 9. CRM Integrations Complètes
- [ ] Service Notion: création page complète
- [ ] Service Airtable: POST row complet
- [ ] Service Google Sheets: append row complet
- [ ] Auto-sync configurable
- [ ] Gestion erreurs et retry

### 10. Logging Avancé
- [ ] Service: `logger.service.ts`
- [ ] Rotation des logs
- [ ] Export vers service externe (optionnel)
- [ ] Métriques pour analytics

### 11. Monitoring
- [ ] Health check: `GET /health`
- [ ] Bull Board pour monitoring queues (optionnel)
- [ ] Métriques Prometheus (optionnel)

---

## 🔄 Ordre d'Implémentation Recommandé

### Phase 1: Core (Semaine 1-2)
1. Message Processing Engine
2. AI Engine amélioré
3. Webhook Meta
4. Sécurité & Rate Limiting

### Phase 2: Providers (Semaine 3-4)
5. TikTok Provider
6. YouTube Provider
7. LinkedIn Headless Browser

### Phase 3: Billing (Semaine 5)
8. Billing Stripe complet

### Phase 4: Polish (Semaine 6)
9. CRM Integrations complètes
10. Logging avancé
11. Monitoring

---

## 📝 Notes d'Implémentation

### Message Processing Engine
- Centraliser toute la logique de traitement
- Séparer les responsabilités (plan check, scenario, decision)
- Faciliter les tests unitaires

### LinkedIn Headless
- Utiliser Playwright avec pool de browsers
- Gérer les sessions de manière isolée
- Implémenter retry et error handling robuste

### Billing Stripe
- Tester avec Stripe CLI en local
- Gérer les webhooks de manière idempotente
- Logger tous les événements Stripe

### AI Engine
- Configurer les prompts de manière modulaire
- Implémenter caching pour éviter appels répétés
- Gérer les erreurs OpenAI gracieusement

---

## 🧪 Tests à Prévoir

- Tests unitaires pour chaque service
- Tests d'intégration pour les providers OAuth
- Tests E2E pour les flux critiques
- Tests de charge pour les queues

---

## 📚 Documentation à Compléter

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Guide de déploiement
- [ ] Guide de configuration des providers
- [ ] Troubleshooting guide



