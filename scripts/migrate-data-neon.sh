#!/bin/bash

# Script de migration des données de Supabase vers Neon via psql
# Utilise pg_dump et psql pour migrer les données

set -e

echo "🚀 Migration des données Supabase → Neon"
echo "========================================="
echo ""

# Charger les variables d'environnement (seulement les lignes VAR=value)
if [ -f .env.local ]; then
    while IFS= read -r line; do
        # Ignorer les commentaires et les lignes vides
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            export "$line"
        fi
    done < .env.local
fi

# Extraire l'URL Supabase depuis .env.local (première occurrence de DATABASE_URL qui pointe vers Supabase)
SUPABASE_DB_URL_RAW=$(grep "^DATABASE_URL=" .env.local 2>/dev/null | head -1 | cut -d'=' -f2- || echo "")
# Nettoyer les guillemets
SUPABASE_DB_URL=$(echo "$SUPABASE_DB_URL_RAW" | tr -d '"' | tr -d "'" | tr -d ' ')

# Si DATABASE_URL pointe vers Supabase, utiliser STORAGE_DATABASE_URL pour Neon
if [[ "$SUPABASE_DB_URL" == *"supabase.co"* ]]; then
    echo "📋 DATABASE_URL pointe vers Supabase"
    # Charger STORAGE_DATABASE_URL depuis .env.development.local
    if [ -f .env.development.local ]; then
        NEON_URL_RAW=$(grep "^STORAGE_DATABASE_URL=" .env.development.local 2>/dev/null | head -1 | cut -d'=' -f2- || echo "")
        # Nettoyer les guillemets
        NEON_URL=$(echo "$NEON_URL_RAW" | tr -d '"' | tr -d "'" | tr -d ' ')
    fi
    
    if [ -z "${NEON_URL:-}" ]; then
        echo "❌ STORAGE_DATABASE_URL manquante pour Neon"
        exit 1
    fi
else
    echo "❌ Impossible de trouver l'URL Supabase dans .env.local"
    exit 1
fi

if [ -z "$SUPABASE_DB_URL" ] || [ -z "$NEON_URL" ]; then
    echo "❌ Variables d'environnement manquantes"
    echo "   SUPABASE_DB_URL: ${SUPABASE_DB_URL:-non définie}"
    echo "   NEON_URL: ${NEON_URL:-non définie}"
    exit 1
fi

echo "📍 Source (Supabase): ${SUPABASE_DB_URL:0:50}..."
echo "📍 Destination (Neon): ${NEON_URL:0:50}..."
echo ""

# Tables à migrer
TABLES=("users" "videos_new" "recipes" "audios" "subscriptions" "programs" "program_regions")

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
    
    # Créer un fichier temporaire pour le CSV
    TEMP_FILE="/tmp/${TABLE}_export_$$.csv"
    
    # Exporter depuis Supabase
    echo "   📥 Export depuis Supabase..."
    if ! psql "$SUPABASE_DB_URL" -c "\COPY (SELECT * FROM $TABLE) TO STDOUT WITH (FORMAT csv, HEADER true)" > "$TEMP_FILE" 2>/dev/null; then
        echo "   ❌ Erreur lors de l'export"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        rm -f "$TEMP_FILE"
        continue
    fi
    
    if [ ! -s "$TEMP_FILE" ]; then
        echo "   ⚠️  Fichier d'export vide"
        rm -f "$TEMP_FILE"
        continue
    fi
    
    # Importer dans Neon avec gestion des conflits
    echo "   📤 Import dans Neon..."
    IMPORT_ERROR=0
    psql "$NEON_URL" -c "\COPY $TABLE FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '\"', ESCAPE '\"')" < "$TEMP_FILE" 2>&1 | grep -v "NOTICE:" || IMPORT_ERROR=$?
    
    if [ $IMPORT_ERROR -ne 0 ]; then
        # Vérifier si c'est juste un conflit (doublon)
        NEON_CHECK_COUNT=$(psql "$NEON_URL" -tAc "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
        if [ "$NEON_CHECK_COUNT" -ge "$COUNT" ]; then
            echo "   ✅ Données déjà présentes (doublons ignorés)"
        else
            echo "   ⚠️  Erreur lors de l'import (vérifiez les logs)"
            TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        fi
    fi
    
    # Vérifier le résultat
    NEON_COUNT=$(psql "$NEON_URL" -tAc "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
    echo "   ✅ $NEON_COUNT enregistrements dans Neon"
    TOTAL_MIGRATED=$((TOTAL_MIGRATED + COUNT))
    
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

