#!/bin/bash

# Script pour créer les tables dans Neon via psql
# Utilise la connection string Neon

set -e

echo "🚀 Création des tables dans Neon PostgreSQL"
echo "============================================"
echo ""

# Charger les variables d'environnement
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)
fi

if [ -f .env.development.local ]; then
    export $(grep -v '^#' .env.development.local | grep STORAGE_DATABASE_URL | xargs)
    # Utiliser STORAGE_DATABASE_URL si DATABASE_URL n'est pas défini
    if [ -z "$DATABASE_URL" ] && [ -n "$STORAGE_DATABASE_URL" ]; then
        DATABASE_URL="$STORAGE_DATABASE_URL"
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Variable DATABASE_URL manquante"
    echo "   Vérifiez .env.local ou .env.development.local"
    exit 1
fi

SQL_FILE="scripts/create-all-tables-neon.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Fichier SQL non trouvé: $SQL_FILE"
    exit 1
fi

echo "📄 Fichier SQL: $SQL_FILE"
echo "📊 Taille: $(wc -c < "$SQL_FILE") caractères"
echo ""

# Vérifier si psql est disponible
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql n'est pas installé"
    echo ""
    echo "💡 Installation de psql:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    echo "📝 Alternative: Utilisez Neon SQL Editor"
    echo "   1. Allez sur https://console.neon.tech"
    echo "   2. Sélectionnez votre projet"
    echo "   3. Cliquez sur 'SQL Editor'"
    echo "   4. Copiez le contenu de $SQL_FILE"
    echo "   5. Collez et exécutez"
    exit 1
fi

echo "⏳ Exécution du SQL via psql..."
echo ""

# Exécuter le SQL
psql "$DATABASE_URL" -f "$SQL_FILE" || {
    echo ""
    echo "❌ Erreur lors de l'exécution"
    echo ""
    echo "💡 Alternative: Utilisez Neon SQL Editor"
    echo "   https://console.neon.tech"
    exit 1
}

echo ""
echo "✅ Tables créées avec succès!"
echo ""
echo "🔍 Vérification des tables..."
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"

echo ""
echo "✨ Migration terminée!"

