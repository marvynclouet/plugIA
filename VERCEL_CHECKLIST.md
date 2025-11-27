# ✅ Checklist Post-Déploiement Vercel

## 🔍 Vérifications à faire après le déploiement

### 1. Variables d'Environnement dans Vercel

Dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**, vérifiez :

- [ ] `NEXT_PUBLIC_API_URL` = URL de votre backend (ex: `https://votre-backend.railway.app`)
- [ ] `NEXT_PUBLIC_META_APP_ID` = Votre Meta App ID
- [ ] Toutes les variables sont définies pour **Production**, **Preview**, et **Development**

### 2. Configuration du Projet

Dans **Settings** → **General** :

- [ ] **Root Directory** : `frontend` (si votre frontend est dans un sous-dossier)
- [ ] **Framework Preset** : Next.js
- [ ] **Build Command** : `npm run build` (ou `cd frontend && npm run build`)
- [ ] **Output Directory** : `.next` (ou `frontend/.next`)

### 3. URLs OAuth à Mettre à Jour

Après avoir obtenu votre URL Vercel (ex: `https://flowia.vercel.app` ou votre domaine personnalisé), mettez à jour :

#### Meta (Instagram/Facebook)
- [ ] Allez sur https://developers.facebook.com/
- [ ] Votre app → **Settings** → **Basic**
- [ ] Ajoutez dans **Valid OAuth Redirect URIs** :
  ```
  https://votre-domaine-vercel.com/auth/meta/callback
  ```

#### TikTok
- [ ] Allez sur https://developers.tiktok.com/
- [ ] Votre app → **Settings**
- [ ] Ajoutez dans **Redirect URIs** :
  ```
  https://votre-domaine-vercel.com/auth/tiktok/callback
  ```

#### Twitter
- [ ] Allez sur https://developer.twitter.com/
- [ ] Votre app → **User authentication settings**
- [ ] Ajoutez dans **Callback URI / Redirect URL** :
  ```
  https://votre-domaine-vercel.com/auth/twitter/callback
  ```

### 4. Backend Configuration

Sur votre plateforme d'hébergement backend (Railway, Render, etc.) :

- [ ] `FRONTEND_URL` = URL de votre site Vercel
- [ ] `FRONTEND_URLS` = URLs avec et sans www (ex: `https://flowia.com,https://www.flowia.com`)
- [ ] CORS configuré pour accepter votre domaine Vercel
- [ ] Toutes les variables d'environnement backend sont configurées

### 5. Test du Déploiement

- [ ] Le site charge correctement sur l'URL Vercel
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les appels API fonctionnent (vérifiez dans Network tab)
- [ ] La connexion/login fonctionne
- [ ] Les redirections OAuth fonctionnent

### 6. Logs et Monitoring

- [ ] Vérifiez les logs dans **Vercel Dashboard** → **Deployments** → Votre déploiement → **Logs**
- [ ] Pas d'erreurs de build
- [ ] Pas d'erreurs runtime

### 7. Domaine Personnalisé (Optionnel)

Si vous avez un domaine personnalisé :

- [ ] Domaine ajouté dans **Settings** → **Domains**
- [ ] DNS configuré correctement (CNAME ou A record)
- [ ] SSL activé automatiquement (Vercel le fait automatiquement)
- [ ] Le site est accessible via votre domaine

---

## 🐛 Problèmes Courants

### Le site ne charge pas
- Vérifiez les logs dans Vercel Dashboard
- Vérifiez que le build a réussi
- Vérifiez les variables d'environnement

### Erreurs API / CORS
- Vérifiez que `NEXT_PUBLIC_API_URL` est correct
- Vérifiez que le backend accepte les requêtes depuis votre domaine Vercel
- Vérifiez la configuration CORS dans le backend

### OAuth ne fonctionne pas
- Vérifiez que les URLs de redirection sont exactement les mêmes (pas d'espace, pas de slash final)
- Vérifiez que les credentials sont corrects dans les variables d'environnement
- Vérifiez les logs backend pour voir les erreurs OAuth

### Variables d'environnement non trouvées
- Vérifiez que les variables sont définies pour **Production**
- Redéployez après avoir ajouté des variables
- Vérifiez que les noms correspondent exactement (case-sensitive)

---

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez les logs dans Vercel Dashboard
2. Vérifiez les logs backend
3. Vérifiez la console du navigateur (F12)
4. Consultez la documentation Vercel : https://vercel.com/docs



