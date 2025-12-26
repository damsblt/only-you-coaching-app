#!/bin/bash

# Script d'installation automatique de Vercel Postgres
# Ce script configure Vercel Postgres pour votre projet

set -e  # Arrêter en cas d'erreur

echo "🚀 Configuration de Vercel Postgres"
echo "===================================="
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "   Installez-le avec: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI trouvé"

# Définir le token Vercel
export VERCEL_TOKEN="[REDACTED_VERCEL_TOKEN]"

# Vérifier la connexion
echo ""
echo "🔐 Vérification de la connexion à Vercel..."
vercel whoami --token="$VERCEL_TOKEN" || {
    echo "❌ Token Vercel invalide ou expiré"
    exit 1
}

echo "✅ Connecté à Vercel"

# Vérifier si le projet est lié
if [ ! -f ".vercel/project.json" ]; then
    echo ""
    echo "📦 Liaison du projet à Vercel..."
    vercel link --token="$VERCEL_TOKEN" --yes
else
    echo "✅ Projet déjà lié à Vercel"
fi

# Lire les informations du projet
PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
PROJECT_NAME=$(cat .vercel/project.json | grep -o '"name":"[^"]*' | cut -d'"' -f4)

echo ""
echo "📋 Projet: $PROJECT_NAME ($PROJECT_ID)"

# Vérifier si une base de données existe déjà
echo ""
echo "🔍 Vérification des bases de données existantes..."
EXISTING_DB=$(vercel postgres ls --token="$VERCEL_TOKEN" 2>/dev/null | grep -i "pilates\|postgres" | head -1 || echo "")

if [ -n "$EXISTING_DB" ]; then
    echo "⚠️  Une base de données existe déjà:"
    echo "   $EXISTING_DB"
    read -p "Voulez-vous créer une nouvelle base de données ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "Utilisation de la base de données existante..."
        DB_NAME=$(echo "$EXISTING_DB" | awk '{print $1}')
    else
        DB_NAME="pilates-app-db"
    fi
else
    DB_NAME="pilates-app-db"
fi

# Créer la base de données si nécessaire
if [ -z "$EXISTING_DB" ] || [[ $REPLY =~ ^[Oo]$ ]]; then
    echo ""
    echo "🗄️  Création de la base de données Postgres..."
    echo "   Nom: $DB_NAME"
    echo "   Région: iad1 (US East) - vous pouvez changer si nécessaire"
    
    # Note: vercel postgres create nécessite une interaction, donc on affiche les instructions
    echo ""
    echo "⚠️  La création de la base nécessite une interaction manuelle"
    echo "   Exécutez cette commande:"
    echo ""
    echo "   vercel postgres create --token=\"$VERCEL_TOKEN\""
    echo ""
    echo "   Ou via le dashboard: https://vercel.com/dashboard"
    echo ""
    read -p "Appuyez sur Entrée une fois la base créée..."
fi

# Lier la base de données au projet
echo ""
echo "🔗 Liaison de la base de données au projet..."
echo "   Sélectionnez la base de données dans la liste:"
vercel postgres ls --token="$VERCEL_TOKEN"

echo ""
echo "⚠️  La liaison nécessite une interaction manuelle"
echo "   Exécutez cette commande:"
echo ""
echo "   vercel postgres link --token=\"$VERCEL_TOKEN\""
echo ""
read -p "Appuyez sur Entrée une fois la base liée..."

# Récupérer les variables d'environnement
echo ""
echo "📥 Récupération des variables d'environnement..."
vercel env pull .env.local --token="$VERCEL_TOKEN" --environment=development

if [ -f ".env.local" ]; then
    echo "✅ Variables d'environnement récupérées dans .env.local"
    
    # Vérifier que POSTGRES_URL est présent
    if grep -q "POSTGRES_URL" .env.local; then
        echo "✅ POSTGRES_URL trouvé"
    else
        echo "⚠️  POSTGRES_URL non trouvé - la base n'est peut-être pas encore liée"
    fi
else
    echo "⚠️  .env.local non créé"
fi

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
if [ -f "package.json" ]; then
    npm install @vercel/postgres --save
    echo "✅ @vercel/postgres installé"
else
    echo "⚠️  package.json non trouvé"
fi

# Tester la connexion
echo ""
echo "🧪 Test de la connexion..."
if [ -f "scripts/test-vercel-postgres.js" ]; then
    node scripts/test-vercel-postgres.js || {
        echo "⚠️  Le test a échoué - vérifiez votre configuration"
    }
else
    echo "⚠️  Script de test non trouvé"
fi

echo ""
echo "===================================="
echo "✨ Configuration terminée !"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Migrer le schéma SQL dans Vercel Dashboard"
echo "   2. Migrer les données: npm run migrate-to-vercel-postgres"
echo "   3. Mettre à jour le code pour utiliser lib/db-vercel.ts"
echo "   4. Tester: npm run dev"
echo ""

