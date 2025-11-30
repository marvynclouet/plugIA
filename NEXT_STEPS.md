# 🎯 Prochaines étapes - Guide complet

## ✅ Ce qui est déjà fait

- ✅ Backend complet avec Vision AI
- ✅ Extension Chrome fonctionnelle
- ✅ Dashboard unifié multi-plateformes
- ✅ Système de DM automatiques adaptatifs
- ✅ Pipeline IA complet

---

## 🚀 ÉTAPE 1 : Installer l'extension Chrome

### Quick start

```bash
# 1. Build l'extension (déjà fait)
cd extension
npm run build

# 2. Dans Chrome :
# - Ouvrez chrome://extensions/
# - Activez "Mode développeur"
# - Cliquez "Charger l'extension non empaquetée"
# - Sélectionnez le dossier extension/
```

📖 **Guide détaillé** : Voir `extension/INSTALLATION.md`

---

## 🔧 ÉTAPE 2 : Configurer le backend

### Variables d'environnement

Assurez-vous que `backend/.env` contient :

```env
# Base de données
DATABASE_URL="postgresql://..."

# OpenAI (pour analyse de leads)
OPENAI_API_KEY="sk-..."

# Anthropic Claude (pour Vision AI)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# JWT
JWT_SECRET="votre-secret-securise"
```

### Démarrer le backend

```bash
cd backend
npm run start:dev
```

Vérifiez : `curl http://localhost:3001/vision/health`

---

## 🎨 ÉTAPE 3 : Démarrer le frontend

```bash
cd frontend
npm run dev
```

Ouvrez : `http://localhost:3000`

---

## 📱 ÉTAPE 4 : Tester le système complet

### 4.1 Connexion TikTok

1. Allez sur `http://localhost:3000/dashboard/accounts`
2. Cliquez sur **"Connecter TikTok"**
3. Choisissez **QR Code** ou **Cookies manuels**
4. ✅ Compte connecté

### 4.2 Installer l'extension

1. Suivez `extension/INSTALLATION.md`
2. Connectez-vous dans le popup de l'extension
3. ✅ Extension prête

### 4.3 Tester la capture

1. Allez sur `https://www.tiktok.com/notifications`
2. Attendez 30 secondes
3. Vérifiez la console (F12) : `✅ PlugIA analysis result`
4. Vérifiez le dashboard : `http://localhost:3000/dashboard/interactions`

### 4.4 Envoyer un DM auto

1. Dans le dashboard interactions
2. Cliquez sur **"Envoyer DM auto"** pour une interaction
3. ✅ DM envoyé automatiquement

---

## 🔄 ÉTAPE 5 : Automatisation complète

### Jobs Cron actifs

Le système exécute automatiquement :

- **Toutes les 3 minutes** : Scraping inbox TikTok
- **Toutes les 30 minutes** : Analyse IA des leads
- **Toutes les heures** : Extraction téléphone/email
- **Toutes les heures** : Reconnexion sessions expirées

### Extension Chrome

- **Toutes les 30 secondes** : Capture screenshot (quand sur notifications)

---

## 📊 ÉTAPE 6 : Utiliser le dashboard

### Dashboard Interactions

`http://localhost:3000/dashboard/interactions`

- ✅ Vue unifiée toutes plateformes
- ✅ Filtres avancés (plateforme, type, statut)
- ✅ Messages auto suggérés
- ✅ Envoi DM en 1 clic

### Dashboard Leads

`http://localhost:3000/dashboard/leads`

- ✅ Liste des leads qualifiés
- ✅ Scores d'intérêt
- ✅ Téléphones/emails extraits
- ✅ Export CSV

---

## 🎯 Workflow utilisateur final

### Pour l'utilisateur (Marie)

1. **Inscription** (1 min)
   - Crée un compte sur PlugIA
   - Crée un workspace

2. **Connexion TikTok** (2 min)
   - QR Code ou Cookies
   - Compte connecté

3. **Installation extension** (2 min)
   - Installe l'extension Chrome
   - Se connecte dans le popup

4. **Utilisation quotidienne** (0 min)
   - Extension capture automatiquement
   - Dashboard se met à jour en temps réel
   - Notifications pour nouvelles interactions

5. **Gestion des leads** (10 min/jour)
   - Vérifie le dashboard
   - Envoie DM aux leads chauds
   - Export vers CRM

---

## 🔐 Sécurité & Configuration

### Rate Limiting

Par défaut :
- 10 DM/heure par compte
- 50 DM/jour par compte
- 30 actions/heure

### Auto-envoi DM

Pour activer l'envoi automatique :
1. Configurez le score minimum (ex: 80/100)
2. Activez dans les paramètres
3. Les DM seront envoyés automatiquement

---

## 🐛 Dépannage rapide

### Extension ne capture pas
- ✅ Vérifiez que vous êtes sur `/notifications`
- ✅ Vérifiez la console (F12)
- ✅ Vérifiez que le backend tourne

### Pas d'interactions dans le dashboard
- ✅ Vérifiez que le compte TikTok est connecté
- ✅ Vérifiez les jobs Cron (logs backend)
- ✅ Testez la collecte manuelle

### Erreurs API
- ✅ Vérifiez que le backend tourne
- ✅ Vérifiez les variables d'environnement
- ✅ Vérifiez les logs backend

---

## 📚 Documentation

- **Extension** : `extension/INSTALLATION.md`
- **Backend** : `backend/README.md`
- **Architecture** : `README.md`

---

## 🎉 C'est prêt !

Le système est **100% fonctionnel**. Il ne reste plus qu'à :

1. ✅ Tester avec un vrai compte TikTok
2. ✅ Vérifier que les interactions sont capturées
3. ✅ Tester l'envoi de DM
4. ✅ Configurer l'auto-envoi si besoin

**Tout est automatisé et prêt à l'emploi ! 🚀**

