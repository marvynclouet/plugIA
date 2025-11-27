# 🔐 Configuration Supabase Flow IA

## Informations du projet

- **Project ID**: `azlpjjpvfwdxjrwpquus`
- **Project URL**: `https://azlpjjpvfwdxjrwpquus.supabase.co`
- **Service Key (Secret)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bHBqanB2ZndkeGpyd3BxdXVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyNTQ0OSwiZXhwIjoyMDc4ODAxNDQ5fQ.ON8CHsxbr0cCD6ejd4r3giCvstVB-XgXTiZrWnQxun0`
- **Public Key (Anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bHBqanB2ZndkeGpyd3BxdXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjU0NDksImV4cCI6MjA3ODgwMTQ0OX0.QikUrGEByU-kT-7D1Sdf_2OhfPYwLfPlTkP7tw-xLv0`

## ⚠️ Action requise : Mot de passe de la base de données

Pour compléter la configuration, vous devez :

1. **Récupérer votre mot de passe de base de données** :
   - Allez sur https://supabase.com/dashboard/project/azlpjjpvfwdxjrwpquus
   - Settings → Database
   - Section "Connection string" ou "Database password"
   - Si vous l'avez oublié, vous pouvez le réinitialiser

2. **Mettre à jour le fichier `.env`** :
   ```bash
   cd backend
   # Remplacez [YOUR-PASSWORD] par votre mot de passe réel
   sed -i '' 's/\[YOUR-PASSWORD\]/VOTRE_MOT_DE_PASSE/g' .env
   ```

   Ou éditez manuellement `.env` et remplacez `[YOUR-PASSWORD]` dans :
   - `DATABASE_URL`
   - `SHADOW_DATABASE_URL`

## 📝 Format de la connection string

Une fois le mot de passe ajouté, vos URLs devraient ressembler à :
```
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres?sslmode=require
SHADOW_DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres?sslmode=require
```

## ✅ Vérification

Après avoir mis à jour le mot de passe, testez la connexion :

```bash
cd backend
npx prisma db push
# ou
npx prisma migrate dev --name init
```

Si tout fonctionne, vous verrez les migrations s'exécuter sans erreur.



