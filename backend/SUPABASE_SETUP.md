# Configuration Supabase pour Flow IA

## 🚀 Configuration rapide

1. **Créer un projet Supabase**
   - Allez sur https://supabase.com/dashboard
   - Créez un nouveau projet
   - Notez votre mot de passe de base de données

2. **Récupérer la connection string**
   - Allez dans **Settings → Database**
   - Copiez la **Connection string** (URI)
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`

3. **Configurer `.env`**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   SHADOW_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```

4. **Initialiser la base de données**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

## ✅ Avantages de Supabase

- ✅ Base de données PostgreSQL gérée
- ✅ SSL/TLS par défaut
- ✅ Backups automatiques
- ✅ Interface d'administration intégrée
- ✅ Pas besoin de Docker pour PostgreSQL
- ✅ Prêt pour la production

## 🔄 Migration depuis Docker local

Si vous utilisiez Docker localement, remplacez simplement la `DATABASE_URL` dans votre `.env` par celle de Supabase.



