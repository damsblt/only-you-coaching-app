#!/bin/bash

# Commandes Vercel prêtes à l'emploi avec le token
# Copiez-collez ces commandes dans votre terminal

export VERCEL_TOKEN="e668zJ4jw4iqJXXY8RD5fWtF"

echo "🔐 Token Vercel configuré"
echo ""
echo "Commandes disponibles:"
echo ""
echo "1. Vérifier la connexion:"
echo "   vercel whoami --token=\"\$VERCEL_TOKEN\""
echo ""
echo "2. Lier le projet:"
echo "   vercel link --token=\"\$VERCEL_TOKEN\" --yes"
echo ""
echo "3. Créer la base de données:"
echo "   vercel postgres create --token=\"\$VERCEL_TOKEN\""
echo ""
echo "4. Lister les bases de données:"
echo "   vercel postgres ls --token=\"\$VERCEL_TOKEN\""
echo ""
echo "5. Lier la base de données:"
echo "   vercel postgres link --token=\"\$VERCEL_TOKEN\""
echo ""
echo "6. Récupérer les variables d'environnement:"
echo "   vercel env pull .env.local --token=\"\$VERCEL_TOKEN\""
echo ""
echo "7. Tester la connexion:"
echo "   npm run test-vercel-postgres"
echo ""
echo "8. Migrer les données:"
echo "   npm run migrate-to-vercel-postgres"
echo ""

# Exécuter la commande si fournie en argument
if [ -n "$1" ]; then
    echo "Exécution: $1"
    eval "$1 --token=\"\$VERCEL_TOKEN\""
fi

