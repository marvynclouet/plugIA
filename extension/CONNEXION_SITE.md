# 🔗 Connexion via le site Flow.IA

L'extension détecte **automatiquement** votre connexion sur le site Flow.IA. Plus besoin de vous connecter dans l'extension !

## ✅ Comment ça fonctionne

### 1. Connectez-vous sur le site Flow.IA

1. Allez sur `http://localhost:3000` (ou votre URL de production)
2. Connectez-vous avec vos identifiants
3. ✅ Vous êtes connecté !

### 2. Connectez vos comptes sociaux

1. Allez sur `http://localhost:3000/dashboard/accounts`
2. Cliquez sur **"Connecter TikTok"** (ou Instagram, Facebook, etc.)
3. Suivez les instructions (QR Code ou Cookies)
4. ✅ Compte connecté !

### 3. L'extension détecte automatiquement

1. Ouvrez le popup de l'extension (icône PlugIA dans Chrome)
2. ✅ L'extension détecte automatiquement :
   - Votre connexion au site
   - Vos comptes sociaux connectés
   - Le token d'authentification

**Aucune action supplémentaire nécessaire !**

---

## 🎯 Workflow utilisateur

```
1. Utilisateur va sur Flow.IA
   ↓
2. Se connecte avec email/password
   ↓
3. Connecte TikTok/Instagram via le site
   ↓
4. Extension détecte automatiquement la connexion
   ↓
5. Extension peut capturer les interactions
```

---

## 🔍 Vérification

### Dans le popup de l'extension

Vous devriez voir :
- ✅ "Connecté en tant que [votre email]"
- ✅ Liste de vos comptes connectés :
  - 🎵 TikTok : @votre_username
  - 📷 Instagram : @votre_username
  - etc.

### Si pas connecté

Si l'extension ne détecte pas votre connexion :
1. Vérifiez que vous êtes bien connecté sur le site Flow.IA
2. Cliquez sur **"Aller sur Flow.IA"** dans le popup
3. Connectez-vous sur le site
4. Revenez au popup (il se mettra à jour automatiquement)

---

## 💡 Avantages

- ✅ **Pas de double connexion** : Connectez-vous une fois sur le site
- ✅ **Synchronisation automatique** : L'extension suit votre session
- ✅ **Sécurité** : Le token est partagé de manière sécurisée
- ✅ **Simplicité** : Aucune configuration supplémentaire

---

## 🔄 Rafraîchissement automatique

L'extension vérifie votre connexion **toutes les 5 secondes** automatiquement.

Si vous vous connectez sur le site, l'extension le détectera dans les 5 secondes.

---

**C'est tout ! L'extension fonctionne automatiquement avec votre connexion sur le site. 🎉**

