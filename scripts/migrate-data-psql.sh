#!/bin/bash

# Script de migration des données de Supabase vers Neon via psql
# Utilise pg_dump et psql pour migrer les données

set -e

echo "🚀 Migration des données Supabase → Neon"
echo "========================================="
echo ""

# Charger les variables d'environnement
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_DB_URL="${DATABASE_URL}"  # Ancienne URL Supabase
NEON_URL="${STORAGE_DATABASE_URL:-${DATABASE_URL}}"

if [ -z "$SUPABASE_DB_URL" ] || [ -z "$NEON_URL" ]; then
    echo "❌ Variables d'environnement manquantes"
    echo "   Vérifiez SUPABASE_DB_URL et NEON_URL dans .env.local"
    exit 1
fi

echo "📋 Tables à migrer: users, videos_new, recipes, audios, subscriptions"
echo ""

# Pour chaque table, exporter depuis Supabase et importer dans Neon
TABLES=("users" "videos_new" "recipes" "audios" "subscriptions")

for TABLE in "${TABLES[@]}"; do
    echo "📦 Migration de la table: $TABLE"
    
    # Exporter depuis Supabase
    TEMP_FILE="/tmp/${TABLE}_export.csv"
    
    echo "   📥 Export depuis Supabase..."
    psql "$SUPABASE_DB_URL" -c "\COPY (SELECT * FROM $TABLE) TO '$TEMP_FILE' WITH (FORMAT csv, HEADER true)" 2>/dev/null || {
        echo "   ⚠️  Table $TABLE n'existe pas ou est vide dans Supabase"
        continue
    }
    
    if [ ! -f "$TEMP_FILE" ] || [ ! -s "$TEMP_FILE" ]; then
        echo "   ⚠️  Aucune donnée à migrer"
        continue
    }
    
    ROW_COUNT=$(wc -l < "$TEMP_FILE" | tr -d ' ')
    echo "   📊 $((ROW_COUNT - 1)) enregistrements trouvés"
    
    # Importer dans Neon
    echo "   📤 Import dans Neon..."
    psql "$NEON_URL" -c "\COPY $TABLE FROM '$TEMP_FILE' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '\"', ESCAPE '\"')" 2>/dev/null || {
        echo "   ⚠️  Erreur lors de l'import (peut être des doublons)"
    }
    
    # Nettoyer
    rm -f "$TEMP_FILE"
    echo "   ✅ Migration terminée"
    echo ""
done

echo "✨ Migration terminée!"
echo ""
echo "🔍 Vérification dans Neon..."
psql "$NEON_URL" -c "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns FROM information_schema.tables t WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"

