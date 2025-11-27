# 🚀 Configuration Rapide Supabase

## Étape 1 : Récupérer la Connection String

1. **Allez sur votre dashboard Supabase** :
   https://supabase.com/dashboard/project/azlpjjpvfwdxjrwpquus

2. **Settings → Database**

3. **Trouvez la section "Connection string"** ou "Connection info"

4. **Copiez l'URI complète** qui ressemble à :
   ```
   postgresql://postgres.azlpjjpvfwdxjrwpquus:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   OU
   ```
   postgresql://postgres:[PASSWORD]@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres
   ```

## Étape 2 : Mettre à jour .env

### Option A : Utiliser le script automatique

```bash
cd backend
./update-env-from-connection-string.sh
# Collez votre connection string quand demandé
```

### Option B : Mise à jour manuelle

Éditez `backend/.env` et remplacez ces lignes :

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres?sslmode=require
SHADOW_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres?sslmode=require
```

**Remplacez `[PASSWORD]`** par le mot de passe de votre connection string.

### Option C : Copier l'URI complète directement

Si vous avez copié l'URI complète depuis Supabase, remplacez simplement :

```env
DATABASE_URL=[COLLEZ_VOTRE_URI_COMPLETE_ICI]?sslmode=require
SHADOW_DATABASE_URL=[COLLEZ_VOTRE_URI_COMPLETE_ICI]?sslmode=require
```

## Étape 3 : Vérifier la connexion

```bash
cd backend
npx prisma db push
```

Si ça fonctionne, vous verrez les tables se créer ! ✅

## 🔍 Si vous ne trouvez pas la connection string

1. **Settings → Database → Connection string**
2. Cliquez sur **"Reveal"** pour voir le mot de passe
3. Ou utilisez **"Copy connection string"** pour copier l'URL complète

## ⚠️ Si le mot de passe est masqué

1. **Settings → Database**
2. Cherchez **"Database password"** ou **"Reset database password"**
3. Cliquez sur **"Reset database password"**
4. **Copiez le nouveau mot de passe** (affiché une seule fois !)
5. Remplacez `[PASSWORD]` dans `.env`

---

## ✅ Configuration actuelle

- ✅ **SUPABASE_URL**: `https://azlpjjpvfwdxjrwpquus.supabase.co`
- ✅ **SUPABASE_SERVICE_KEY**: Configuré
- ⚠️ **DATABASE_URL**: Nécessite le mot de passe depuis la connection string

Une fois la connection string ajoutée, tout sera prêt ! 🚀

