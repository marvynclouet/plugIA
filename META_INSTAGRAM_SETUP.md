# 📱 Configuration Instagram API - Meta Developer

## Étape 1 : Ajouter les autorisations requises

1. **Allez dans votre app Meta** :
   https://developers.facebook.com/apps/871634445544768

2. **Products → Instagram → Permissions and Features**

3. **Ajoutez ces permissions** :
   - ✅ `instagram_business_basic` - Accès de base à Instagram Business
   - ✅ `instagram_manage_comments` - Gérer les commentaires
   - ✅ `instagram_business_manage_messages` - Gérer les messages privés

4. **Cliquez sur "Save Changes"**

---

## Étape 2 : Ajouter un compte Instagram (Générer des tokens)

1. **Dans Products → Instagram → Basic Display** ou **Instagram Graph API**

2. **Ajoutez un compte Instagram** :
   - Cliquez sur "Add or Remove Instagram Accounts"
   - Connectez votre compte Instagram Business

3. **Important** : Avant de continuer, allez dans **Roles → Instagram Testers**
   - Ajoutez votre compte Instagram comme testeur
   - Sinon vous ne pourrez pas générer de tokens

4. **Générez un token d'accès** :
   - Utilisez le "User Token Generator"
   - Sélectionnez les permissions nécessaires
   - Copiez le token (vous en aurez besoin pour tester)

---

## Étape 3 : Configurer les webhooks (Optionnel pour l'instant)

1. **Dans Products → Instagram → Webhooks**

2. **Configurez l'URL de callback** :
   ```
   https://flowia.com/api/social-accounts/meta/webhook
   ```
   (ou `http://localhost:3001/social-accounts/meta/webhook` pour le dev)

3. **Token de vérification** :
   - Utilisez le même que `META_VERIFY_TOKEN` dans votre `.env`
   - Ou générez-en un nouveau et mettez-le dans `.env`

4. **S'abonner aux événements** :
   - `messages` - Nouveaux messages reçus
   - `messaging_postbacks` - Actions utilisateur
   - `message_reads` - Messages lus

**Note** : Les webhooks nécessitent que l'app soit en mode "Live" (publiée). Pour le développement, vous pouvez les configurer plus tard.

---

## Étape 4 : Configurer la connexion professionnelle Instagram

1. **Assurez-vous que votre compte Instagram est un Business Account** :
   - Instagram → Settings → Account → Switch to Professional Account
   - Choisissez "Business"

2. **Liez votre compte Instagram à une Page Facebook** :
   - Instagram → Settings → Account → Linked Accounts → Facebook
   - Connectez votre Page Facebook

3. **Vérifiez dans Meta Developer** :
   - Products → Instagram → Basic Display
   - Votre compte Instagram devrait apparaître comme connecté

---

## Étape 5 : Effectuer le Contrôle App (App Review)

⚠️ **Important** : Pour utiliser l'API Instagram en production, vous devez soumettre votre app pour révision.

### Pour le développement (Mode Test) :

1. **Allez dans App Review → Permissions and Features**

2. **Ajoutez les permissions nécessaires** :
   - `instagram_business_basic`
   - `instagram_manage_comments`
   - `instagram_business_manage_messages`

3. **Mode Test** :
   - Vous pouvez tester avec des comptes ajoutés comme "Testers"
   - Allez dans **Roles → Instagram Testers**
   - Ajoutez les comptes Instagram qui peuvent tester

### Pour la production (Mode Live) :

1. **Soumettez votre app pour révision** :
   - App Review → Permissions and Features
   - Cliquez sur "Request" pour chaque permission
   - Remplissez le formulaire de soumission

2. **Fournissez les informations demandées** :
   - Description de l'utilisation
   - Vidéo de démonstration (screencast)
   - Instructions de test
   - URL de votre app

3. **Attendez l'approbation** (peut prendre plusieurs jours)

---

## Configuration dans votre code

### Backend (.env)

```env
META_APP_ID=871634445544768
META_APP_SECRET=16f21605bc76489044d78cd752d3cae2
META_REDIRECT_URI=https://flowia.com/auth/meta/callback
META_VERIFY_TOKEN=votre_token_webhook_securise
```

### Permissions à utiliser dans le code

Les scopes dans `instagram.service.ts` sont maintenant corrects :
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `pages_messaging`
- `public_profile`

---

## Checklist rapide

- [ ] Permissions ajoutées dans Meta Developer
- [ ] Compte Instagram Business créé et lié à une Page Facebook
- [ ] Compte Instagram ajouté comme testeur dans Roles
- [ ] Token d'accès généré (pour tests)
- [ ] URL de redirection configurée dans Settings → Basic
- [ ] Webhooks configurés (optionnel pour dev)
- [ ] App soumise pour révision (pour production)

---

## URLs importantes

- **App Dashboard** : https://developers.facebook.com/apps/871634445544768
- **Instagram Product** : https://developers.facebook.com/apps/871634445544768/instagram-basic-display/
- **Roles & Testers** : https://developers.facebook.com/apps/871634445544768/roles/
- **App Review** : https://developers.facebook.com/apps/871634445544768/app-review/

---

## Notes importantes

1. **Mode Test vs Mode Live** :
   - En mode Test, seuls les testeurs peuvent utiliser l'app
   - En mode Live, tout le monde peut utiliser l'app (après approbation)

2. **Instagram Business Account requis** :
   - Les comptes Instagram personnels ne peuvent pas utiliser l'API Business
   - Vous devez convertir votre compte en Business Account

3. **Page Facebook requise** :
   - Instagram Business doit être lié à une Page Facebook
   - C'est obligatoire pour l'API Instagram Graph

4. **Webhooks** :
   - Nécessitent que l'app soit en mode Live
   - Pour le développement, vous pouvez utiliser le polling à la place



