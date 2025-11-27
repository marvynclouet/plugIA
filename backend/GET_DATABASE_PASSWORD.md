# 🔍 Comment récupérer la connection string Supabase

## Option 1 : Connection string complète (Recommandé)

1. Allez sur : https://supabase.com/dashboard/project/azlpjjpvfwdxjrwpquus
2. Cliquez sur **Settings** (icône engrenage en bas à gauche)
3. Cliquez sur **Database** dans le menu de gauche
4. Descendez jusqu'à la section **"Connection string"** ou **"Connection pooling"**
5. Vous verrez plusieurs options :
   - **URI** : C'est ce qu'il vous faut !
   - **JDBC** : Alternative
   - **Golang** : Alternative
   - **psql** : Alternative

6. **Copiez l'URI** qui ressemble à :
   ```
   postgresql://postgres.azlpjjpvfwdxjrwpquus:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   OU
   ```
   postgresql://postgres:[MOT_DE_PASSE]@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres
   ```

7. **Copiez cette URL complète** et remplacez directement dans `.env` :
   ```bash
   # Remplacez les lignes DATABASE_URL et SHADOW_DATABASE_URL par l'URI complète
   ```

## Option 2 : Réinitialiser le mot de passe

Si vous ne trouvez pas la connection string :

1. Allez sur : https://supabase.com/dashboard/project/azlpjjpvfwdxjrwpquus
2. Settings → Database
3. Cherchez **"Database password"** ou **"Reset database password"**
4. Cliquez sur **"Reset database password"**
5. **Copiez le nouveau mot de passe** (il ne sera affiché qu'une fois !)
6. Remplacez `[YOUR-PASSWORD]` dans `.env` par ce mot de passe

## Option 3 : Utiliser la connection string depuis l'interface

Dans Settings → Database, vous pouvez aussi :
- Voir la connection string avec le mot de passe masqué
- Cliquer sur "Reveal" pour voir le mot de passe
- Ou utiliser "Copy connection string" qui copie l'URL complète

## ⚠️ Important

Le mot de passe dans la connection string est déjà encodé (URL encoded), donc si vous copiez l'URI complète, utilisez-la telle quelle sans modifier le mot de passe.
