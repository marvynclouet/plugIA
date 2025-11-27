# 🤖 FlowIA Agent - Flow Complet Expliqué

## 🎯 Concept Clé

**L'agent IA ne se connecte pas. L'utilisateur se connecte.**

Une fois que l'utilisateur est connecté, l'agent IA utilise **LA SESSION** de l'utilisateur pour naviguer dans TikTok comme un humain.

---

## 📋 Flow Complet

### 1️⃣ Connexion Utilisateur

**Mode A - OAuth (si disponible)**
```
Utilisateur clique → OAuth TikTok → Token récupéré → Session stockée
```

**Mode B - Capture Cookies (Playwright)**
```
Utilisateur clique → Fenêtre TikTok s'ouvre → Utilisateur se connecte → 
FlowIA capture les cookies → Session stockée (chiffrée)
```

**Résultat** : Session TikTok valide stockée dans `social_sessions` (cookies chiffrés)

---

### 2️⃣ Agent IA Prend le Relai

**⚠️ IMPORTANT : L'agent IA n'utilise PAS d'API TikTok**

L'agent IA :
1. Ouvre TikTok avec **LA SESSION** de l'utilisateur (cookies)
2. Navigue dans TikTok comme un humain (via Playwright)
3. Lit le DOM et "voit" TikTok comme un humain
4. Extrait les interactions depuis les pages TikTok

**Code** : `TikTokBrowserService.getAllInteractions(cookies)`
- Ouvre `https://www.tiktok.com/notifications`
- Scrolle pour charger tout l'historique
- Lit le DOM et extrait : likes, comments, follows, shares, mentions

---

### 3️⃣ Observation par l'Agent IA

L'agent IA "voit" TikTok et récupère :

✅ **Interactions**
- Qui a liké
- Qui a commenté
- Qui a follow
- Qui a partagé
- Mentions

✅ **Profils**
- Usernames
- Stats (followers, etc.)
- Bio

✅ **Messages**
- DM reçus
- Conversations

✅ **Stats**
- Vues
- Engagement
- Tendances

**Tout se fait via Playwright en lisant le DOM, pas d'API.**

---

### 4️⃣ Analyse IA

L'agent IA analyse ce qu'il a "vu" :

🧠 **Classification**
- Artiste sérieux
- Beatmaker
- Client potentiel
- Fan engagé
- Observateur passif
- Troll

📊 **Scoring**
- Score d'intérêt 0-100
- Calculé depuis les interactions observées

💬 **Génération Messages**
- Messages personnalisés basés sur ce que l'agent a "vu"
- Contexte : interactions, profil, comportement

**Code** : `LeadAnalysisService.analyzePendingLeads()`
- Utilise OpenAI GPT-4o-mini
- Analyse les interactions
- Génère classification + score + message

---

### 5️⃣ Dashboard Utilisateur

L'utilisateur voit dans le dashboard :

📊 **Interactions**
- Liste de toutes les interactions observées
- Filtres : date, type, plateforme

🎯 **Leads**
- Liste des leads identifiés par l'IA
- Score, type, dernière interaction
- Message suggéré pour chaque lead

💬 **Messages Suggérés**
- Messages générés par l'IA
- Prêts à être validés

---

### 6️⃣ Mode Autopilot

L'utilisateur valide les actions proposées :

1. L'utilisateur sélectionne les messages à envoyer
2. L'utilisateur clique "Valider X actions"
3. FlowIA marque les messages comme validés
4. FlowIA prépare les infos pour ouvrir les DM

**⚠️ IMPORTANT** : L'utilisateur doit cliquer "Envoyer" dans TikTok
- FlowIA prépare tout mais n'envoie pas automatiquement
- Sécurité : respect des règles anti-abus

---

### 7️⃣ Envoi DM par l'Agent IA

Quand l'utilisateur valide, l'agent IA peut envoyer le DM :

**Via le navigateur (comme un humain)** :
```typescript
// L'agent IA ouvre TikTok avec la session
await page.goto(`https://www.tiktok.com/@${username}`);

// L'agent IA clique sur "Message" (comme un humain)
await page.click('button:has-text("Message")');

// L'agent IA tape le message
await page.type('textarea', message);

// L'agent IA clique sur "Send"
await page.click('button:has-text("Send")');
```

**⚠️ Pas d'API** : Tout se fait via Playwright en cliquant comme un humain.

**Rate Limiting** : Max 10 DM/heure pour éviter la détection.

---

## 🔄 Cycle Automatique

Une fois connecté, l'agent IA tourne automatiquement :

```
Toutes les 5 minutes :
1. Agent IA ouvre TikTok avec session utilisateur
2. Agent IA observe les interactions
3. Agent IA sauvegarde en base
4. Agent IA analyse et génère leads/messages
5. Dashboard se met à jour
```

**Code** : `TikTokMonitorService.startMonitoring()`
- Démarre un interval toutes les 5 minutes
- Appelle `TikTokAIAgentService.runFullCycle()`

---

## 🎯 Avantage Stratégique

**Les autres outils** : Scraping limité, APIs restreintes

**FlowIA** :
- ✅ Agent IA + Browser automatisé + Session utilisateur réelle
- ✅ Navigation comme un humain
- ✅ Pas de limitations d'API
- ✅ Analyse intelligente
- ✅ Génération de messages personnalisés

---

## 📁 Structure du Code

```
backend/src/social-accounts/providers/
├── tiktok-ai-agent.service.ts    # 🤖 Agent IA (orchestre tout)
├── tiktok-browser.service.ts     # 🌐 Navigateur (Playwright)
├── tiktok-monitor.service.ts     # 🔄 Monitor (démarre l'agent)
└── tiktok-cookies.service.ts     # 🍪 Capture cookies

backend/src/leads/
└── lead-analysis.service.ts      # 🧠 Analyse IA (OpenAI)
```

---

## 🔑 Points Clés à Retenir

1. **L'utilisateur se connecte** → Session stockée
2. **L'agent IA utilise la session** → Ouvre TikTok avec Playwright
3. **L'agent IA observe** → Lit le DOM, pas d'API
4. **L'agent IA analyse** → Classification + Scoring + Messages
5. **L'utilisateur valide** → Actions préparées
6. **L'agent IA envoie** → Via navigateur, comme un humain

**Tout est automatique après la connexion initiale !** 🚀



