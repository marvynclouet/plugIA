#!/bin/bash
# Script pour mettre à jour .env avec la connection string Supabase

echo "🔧 Mise à jour de .env avec la connection string Supabase"
echo ""
echo "Collez votre connection string complète depuis Supabase Dashboard:"
echo "(Format: postgresql://postgres:[PASSWORD]@db.azlpjjpvfwdxjrwpquus.supabase.co:5432/postgres)"
echo ""
read -p "Connection string: " CONNECTION_STRING

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Connection string vide, annulation"
    exit 1
fi

# Mettre à jour DATABASE_URL
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$CONNECTION_STRING?sslmode=require|g" .env

# Mettre à jour SHADOW_DATABASE_URL (même URL)
sed -i '' "s|SHADOW_DATABASE_URL=.*|SHADOW_DATABASE_URL=$CONNECTION_STRING?sslmode=require|g" .env

echo ""
echo "✅ Fichier .env mis à jour !"
echo ""
echo "Vérification:"
grep "DATABASE_URL" .env | head -2
