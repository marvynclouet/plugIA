# 🔥 Guide : Capturer les cookies TikTok avec msToken

## ⚠️ PROBLÈME CRITIQUE

Sans le cookie `msToken`, l'agent IA est **aveugle** et ne peut pas voir vos interactions TikTok.

## ✅ Solution : Capturer depuis TOUS les domaines

Le cookie `msToken` peut être sur différents domaines TikTok. Il faut capturer depuis **TOUS** les domaines.

---

## 📋 Instructions étape par étape

### 1. Ouvrir TikTok et se connecter
- Allez sur https://www.tiktok.com
- Connectez-vous avec votre compte

### 2. Ouvrir DevTools
- Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
- Allez dans l'onglet **"Application"** (ou "Stockage" en français)

### 3. Capturer les cookies depuis TOUS les domaines

Dans le menu de gauche, sous **"Cookies"**, vous devez capturer depuis :

#### ✅ Domain 1 : `https://tiktok.com`
1. Cliquez sur **"Cookies"** → **"https://tiktok.com"**
2. Dans le tableau, cliquez sur la première ligne
3. **Ctrl+A / Cmd+A** pour tout sélectionner
4. **Ctrl+C / Cmd+C** pour copier
5. Collez dans un fichier temporaire (ou gardez en mémoire)

#### ✅ Domain 2 : `https://www.tiktok.com`
1. Cliquez sur **"Cookies"** → **"https://www.tiktok.com"**
2. Dans le tableau, cliquez sur la première ligne
3. **Ctrl+A / Cmd+A** pour tout sélectionner
4. **Ctrl+C / Cmd+C** pour copier
5. Ajoutez à votre fichier temporaire (ou gardez en mémoire)

#### ✅ Domain 3 : `https://m.tiktok.com`
1. Cliquez sur **"Cookies"** → **"https://m.tiktok.com"**
2. Dans le tableau, cliquez sur la première ligne
3. **Ctrl+A / Cmd+A** pour tout sélectionner
4. **Ctrl+C / Cmd+C** pour copier
5. Ajoutez à votre fichier temporaire (ou gardez en mémoire)

### 4. Vérifier la présence de msToken

Avant de coller dans FlowIA, vérifiez que vous avez bien le cookie `msToken` :

- Cherchez dans vos cookies copiés : `msToken=xxxxx`
- Si vous ne le trouvez pas, vérifiez les 3 domaines à nouveau
- Le cookie `msToken` est **ESSENTIEL**

### 5. Coller dans FlowIA

1. Copiez **TOUS** les cookies (des 3 domaines) dans le champ FlowIA
2. Cliquez sur "Connecter TikTok"
3. L'agent IA vérifiera automatiquement la présence de `msToken`

---

## 🔍 Cookies essentiels à avoir

Votre capture doit contenir **au minimum** :

- ✅ `msToken=xxxxx` ← **LE PLUS IMPORTANT**
- ✅ `sessionid=xxxxx`
- ✅ `sid_tt=xxxxx`
- ✅ `sid_guard=xxxxx`
- ✅ `sid_ucp_v1=xxxxx` ou `ssid_ucp_v1=xxxxx`
- ✅ `ttwid=xxxxx`
- ✅ `uid_tt=xxxxx`

---

## ❌ Erreurs courantes

### Erreur : "msToken manquant"
**Cause** : Vous n'avez capturé que depuis `www.tiktok.com`  
**Solution** : Capturez depuis les 3 domaines (tiktok.com, www.tiktok.com, m.tiktok.com)

### Erreur : "Username incorrect (Insta)"
**Cause** : Pas de `msToken` → TikTok ne vous reconnaît pas  
**Solution** : Reconnectez-vous et capturez depuis TOUS les domaines

### Erreur : "Aucune interaction trouvée"
**Cause** : Pas de `msToken` → L'agent IA est aveugle  
**Solution** : Vérifiez que `msToken` est bien présent dans vos cookies

---

## ✅ Vérification

Après avoir collé vos cookies, vous verrez dans le terminal :

```
================================================================================
🔍 [SERVICE] VÉRIFICATION DES COOKIES ESSENTIELS
================================================================================
   🍪 Total cookies reçus: 25
   ✅ msToken: ✅ PRÉSENT
   ✅ sessionid: ✅ PRÉSENT
   ✅ sid_tt: ✅ PRÉSENT
================================================================================
```

Si vous voyez `❌ msToken: MANQUANT`, reconnectez-vous et capturez depuis les 3 domaines.

---

## 🎯 Résultat attendu

Avec `msToken` présent :
- ✅ L'agent IA voit votre vrai username (pas "Insta")
- ✅ L'agent IA voit toutes vos interactions
- ✅ L'agent IA voit vos notifications
- ✅ L'agent IA peut analyser et générer des messages

Sans `msToken` :
- ❌ L'agent IA est aveugle
- ❌ Username incorrect
- ❌ Aucune interaction visible
- ❌ L'agent ne peut pas fonctionner

---

**💡 Astuce** : Si vous avez déjà des cookies sans `msToken`, reconnectez-vous et recapturez depuis les 3 domaines.



