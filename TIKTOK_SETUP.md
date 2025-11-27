# 🎵 Configuration TikTok API

## Prérequis

1. **Compte TikTok Business** ou **Compte TikTok Creator**
2. **Compte développeur TikTok** : https://developers.tiktok.com/

---

## Étape 1 : Créer une application TikTok

1. **Allez sur TikTok Developers** :
   https://developers.tiktok.com/

2. **Connectez-vous** avec votre compte TikTok Business/Creator

3. **Créez une nouvelle application** :
   - Cliquez sur "Create an app"
   - Remplissez les informations :
     - **App Name** : Flow IA
     - **App Description** : Plateforme d'automatisation des interactions sociales
     - **Category** : Business Tools ou Social
     - **Website URL** : https://flowia.com
     - **Privacy Policy URL** : https://flowia.com/legal/privacy
     - **Terms of Service URL** : https://flowia.com/legal/terms

4. **Soumettez la demande** (peut prendre quelques jours pour approbation)

---

## Étape 2 : Configurer les produits TikTok

Une fois l'app approuvée, activez les produits nécessaires :

### A) TikTok Login Kit (OAuth)

1. **Allez dans votre app** → **Products** → **TikTok Login**

2. **Configurez les scopes** :
   - ✅ `user.info.basic` - Informations de base du profil
   - ✅ `user.info.profile` - Informations du profil public
   - ✅ `user.info.stats` - Statistiques du profil
   - ✅ `video.list` - Liste des vidéos
   - ✅ `video.upload` - Upload de vidéos (si nécessaire)
   - ✅ `video.publish` - Publier des vidéos (si nécessaire)

3. **Configurez les URLs de redirection** :
   - **Redirect URI** : `https://flowia.com/auth/tiktok/callback`
   - **Development Redirect URI** : `http://localhost:3000/auth/tiktok/callback`

4. **Sauvegardez**

### B) TikTok Content API (Optionnel - pour gérer le contenu)

1. **Products** → **Content API**

2. **Activez les permissions** :
   - ✅ `video.list` - Lister les vidéos
   - ✅ `video.data` - Données des vidéos
   - ✅ `comment.list` - Lister les commentaires
   - ✅ `comment.create` - Créer des commentaires
   - ✅ `user.info` - Informations utilisateur

---

## Étape 3 : Récupérer les credentials

1. **Allez dans votre app** → **Basic Information**

2. **Récupérez** :
   - **Client Key** (App ID) : `xxxxxxxxxxxxx`
   - **Client Secret** : `xxxxxxxxxxxxx`

3. **Ajoutez-les dans votre `.env` backend** :
   ```env
   TIKTOK_CLIENT_KEY=xxxxxxxxxxxxx
   TIKTOK_CLIENT_SECRET=xxxxxxxxxxxxx
   TIKTOK_REDIRECT_URI=https://flowia.com/auth/tiktok/callback
   ```

---

## Étape 4 : Configurer les permissions

### Permissions nécessaires pour Flow IA :

1. **Lire les commentaires** :
   - `comment.list` - Pour récupérer les commentaires sur vos vidéos

2. **Lire les interactions** :
   - `user.info.stats` - Pour les statistiques d'engagement
   - `video.list` - Pour lister vos vidéos

3. **Envoyer des messages** (si disponible) :
   - TikTok n'a pas d'API de messagerie directe comme Instagram
   - Vous devrez utiliser les commentaires ou mentions

---

## Étape 5 : Tester la connexion

1. **Redémarrez votre backend** avec les nouvelles variables

2. **Dans Flow IA** :
   - Allez dans Dashboard → Comptes
   - Cliquez sur "Connecter TikTok"
   - Autorisez l'application

3. **Vérifiez les logs backend** pour voir si le token est bien récupéré

---

## Configuration dans le code

### Backend (.env)

```env
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_REDIRECT_URI=https://flowia.com/auth/tiktok/callback
# Local: TIKTOK_REDIRECT_URI=http://localhost:3000/auth/tiktok/callback
```

### Scopes à utiliser

Dans `tiktok.service.ts`, utilisez ces scopes :
```typescript
const scopes = [
  'user.info.basic',
  'user.info.profile',
  'user.info.stats',
  'video.list',
  'comment.list',
].join(',');
```

---

## Limitations TikTok API

⚠️ **Important** : TikTok a des limitations strictes :

1. **Pas d'API de messagerie directe** :
   - TikTok n'a pas d'API pour envoyer des DM
   - Vous devrez utiliser les commentaires ou mentions

2. **Rate Limits** :
   - TikTok limite le nombre de requêtes par jour
   - Vérifiez les quotas dans votre dashboard développeur

3. **App Review** :
   - Votre app doit être approuvée pour utiliser certaines fonctionnalités
   - Le processus peut prendre plusieurs jours

4. **Compte Business/Creator requis** :
   - Les comptes personnels ne peuvent pas utiliser l'API
   - Vous devez convertir votre compte en Business ou Creator

---

## URLs importantes

- **TikTok Developers** : https://developers.tiktok.com/
- **Documentation API** : https://developers.tiktok.com/doc/
- **OAuth Guide** : https://developers.tiktok.com/doc/tiktok-api-v2-get-access-token-user-access-token-management/

---

## Checklist

- [ ] Compte TikTok Business/Creator créé
- [ ] App TikTok créée et approuvée
- [ ] TikTok Login Kit activé
- [ ] Scopes configurés
- [ ] URLs de redirection configurées
- [ ] Client Key et Client Secret récupérés
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Backend redémarré
- [ ] Test de connexion effectué

---

## Notes importantes

1. **TikTok Login vs Content API** :
   - TikTok Login : Pour authentifier les utilisateurs
   - Content API : Pour gérer le contenu (nécessite une approbation supplémentaire)

2. **Environnement de test** :
   - TikTok fournit un environnement de test (Sandbox)
   - Utilisez-le pour développer avant de passer en production

3. **Webhooks** :
   - TikTok supporte les webhooks pour certains événements
   - Configurez-les dans votre app pour recevoir les notifications

4. **Sécurité** :
   - Ne partagez jamais votre Client Secret
   - Utilisez HTTPS pour toutes les URLs de callback
   - Stockez les tokens de manière sécurisée (chiffrement)



