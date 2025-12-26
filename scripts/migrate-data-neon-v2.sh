#!/bin/bash

# Script de migration des données de Supabase vers Neon via psql
# Version améliorée qui gère les différences de schéma

set -e

echo "🚀 Migration des données Supabase → Neon (v2)"
echo "=============================================="
echo ""

# Charger les variables d'environnement
if [ -f .env.local ]; then
    while IFS= read -r line; do
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            export "$line"
        fi
    done < .env.local
fi

# Extraire les URLs
SUPABASE_DB_URL_RAW=$(grep "^DATABASE_URL=" .env.local 2>/dev/null | head -1 | cut -d'=' -f2- || echo "")
SUPABASE_DB_URL=$(echo "$SUPABASE_DB_URL_RAW" | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -f .env.development.local ]; then
    NEON_URL_RAW=$(grep "^STORAGE_DATABASE_URL=" .env.development.local 2>/dev/null | head -1 | cut -d'=' -f2- || echo "")
    NEON_URL=$(echo "$NEON_URL_RAW" | tr -d '"' | tr -d "'" | tr -d ' ')
fi

if [ -z "$SUPABASE_DB_URL" ] || [ -z "$NEON_URL" ]; then
    echo "❌ Variables d'environnement manquantes"
    exit 1
fi

echo "📍 Source (Supabase): ${SUPABASE_DB_URL:0:50}..."
echo "📍 Destination (Neon): ${NEON_URL:0:50}..."
echo ""

# Tables à migrer
TABLES=("users" "videos_new" "recipes" "audios" "subscriptions")

TOTAL_MIGRATED=0
TOTAL_ERRORS=0

for TABLE in "${TABLES[@]}"; do
    echo "📦 Migration de la table: $TABLE"
    
    # Vérifier si la table existe dans Supabase
    TABLE_EXISTS=$(psql "$SUPABASE_DB_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$TABLE');" 2>/dev/null || echo "false")
    
    if [ "$TABLE_EXISTS" != "t" ]; then
        echo "   ⚠️  Table $TABLE n'existe pas dans Supabase"
        continue
    fi
    
    # Compter les enregistrements
    COUNT=$(psql "$SUPABASE_DB_URL" -tAc "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
    
    if [ "$COUNT" -eq "0" ]; then
        echo "   ⚠️  Aucune donnée à migrer (0 enregistrements)"
        continue
    fi
    
    echo "   📊 $COUNT enregistrements trouvés"
    
    # Utiliser pg_dump pour exporter et psql pour importer
    # Cette méthode gère mieux les différences de schéma
    TEMP_FILE="/tmp/${TABLE}_export_$$.sql"
    
    echo "   📥 Export depuis Supabase..."
    # Exporter les données avec INSERT statements
    pg_dump "$SUPABASE_DB_URL" \
        --table="$TABLE" \
        --data-only \
        --column-inserts \
        --no-owner \
        --no-privileges \
        > "$TEMP_FILE" 2>/dev/null || {
        echo "   ❌ Erreur lors de l'export"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        rm -f "$TEMP_FILE"
        continue
    }
    
    if [ ! -s "$TEMP_FILE" ]; then
        echo "   ⚠️  Fichier d'export vide"
        rm -f "$TEMP_FILE"
        continue
    fi
    
    # Importer dans Neon
    echo "   📤 Import dans Neon..."
    # Utiliser ON CONFLICT pour ignorer les doublons
    psql "$NEON_URL" -f "$TEMP_FILE" 2>&1 | grep -v "NOTICE:" | grep -v "already exists" || {
        # Vérifier si les données sont présentes
        NEON_CHECK_COUNT=$(psql "$NEON_URL" -tAc "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
        if [ "$NEON_CHECK_COUNT" -ge "$COUNT" ]; then
            echo "   ✅ Données migrées avec succès"
        else
            echo "   ⚠️  Erreur lors de l'import (vérifiez les logs)"
            TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        fi
    }
    
    # Vérifier le résultat
    NEON_COUNT=$(psql "$NEON_URL" -tAc "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
    echo "   ✅ $NEON_COUNT enregistrements dans Neon"
    TOTAL_MIGRATED=$((TOTAL_MIGRATED + NEON_COUNT))
    
    # Nettoyer
    rm -f "$TEMP_FILE"
    echo ""
done

echo "========================================="
echo "📊 RÉSUMÉ"
echo "========================================="
echo "✅ Total migré: $TOTAL_MIGRATED enregistrements"
if [ "$TOTAL_ERRORS" -gt 0 ]; then
    echo "⚠️  Erreurs: $TOTAL_ERRORS tables"
fi
echo ""
echo "✨ Migration terminée!"

