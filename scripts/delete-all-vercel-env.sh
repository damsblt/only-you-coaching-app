#!/bin/bash

# Script pour supprimer toutes les variables d'environnement Vercel
# Projet: pilates-coaching-app (damsblts-projects/only-you-coaching)

export VERCEL_TOKEN="e668zJ4jw4iqJXXY8RD5fWtF"

echo "🗑️  Suppression de toutes les variables d'environnement Vercel"
echo "📦 Projet: pilates-coaching-app"
echo ""

# Liste des variables à supprimer (basée sur vercel env ls)
VARIABLES=(
  "STORAGE_STACK_SECRET_SERVER_KEY"
  "STORAGE_DATABASE_URL"
  "STORAGE_POSTGRES_PASSWORD"
  "STORAGE_POSTGRES_DATABASE"
  "STORAGE_PGPASSWORD"
  "STORAGE_PGDATABASE"
  "STORAGE_PGHOST_UNPOOLED"
  "NEXT_PUBLIC_STORAGE_STACK_PROJECT_ID"
  "STORAGE_PGUSER"
  "STORAGE_POSTGRES_URL_NO_SSL"
  "STORAGE_POSTGRES_HOST"
  "NEXT_PUBLIC_STORAGE_STACK_PUBLISHABLE_CLIENT_KEY"
  "STORAGE_NEON_PROJECT_ID"
  "STORAGE_POSTGRES_URL"
  "STORAGE_POSTGRES_PRISMA_URL"
  "STORAGE_DATABASE_URL_UNPOOLED"
  "STORAGE_POSTGRES_URL_NON_POOLING"
  "STORAGE_PGHOST"
  "STORAGE_POSTGRES_USER"
  "STRIPE_WEBHOOK_SECRET"
  "AWS_REGION"
  "AWS_S3_BUCKET_NAME"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "PRISMA_DISABLE_PREPARED_STATEMENTS"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_ACCESS_KEY_ID"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
)

# Supprimer chaque variable pour tous les environnements
for var in "${VARIABLES[@]}"; do
  echo "Suppression de $var..."
  
  # Supprimer pour Production
  vercel env rm "$var" production --yes --token="$VERCEL_TOKEN" 2>/dev/null || true
  
  # Supprimer pour Preview
  vercel env rm "$var" preview --yes --token="$VERCEL_TOKEN" 2>/dev/null || true
  
  # Supprimer pour Development
  vercel env rm "$var" development --yes --token="$VERCEL_TOKEN" 2>/dev/null || true
  
  echo "✅ $var supprimée"
done

echo ""
echo "✅ Toutes les variables d'environnement ont été supprimées !"
echo ""
echo "Vérification..."
vercel env ls --token="$VERCEL_TOKEN"





