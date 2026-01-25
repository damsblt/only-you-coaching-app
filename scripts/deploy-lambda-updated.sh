#!/bin/bash

# Script pour déployer la version mise à jour de la Lambda
# Met à jour uniquement le code, pas la configuration

set -e

FUNCTION_NAME="only-you-coaching-thumbnail-generator"
REGION="eu-north-1"

echo "🚀 Déploiement de la Lambda mise à jour..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Vérifier que le fichier index.js existe
if [ ! -f "lambda/index.js" ]; then
  echo "❌ lambda/index.js non trouvé"
  exit 1
fi

# 2. Créer le package Lambda
echo "📦 1. Création du package Lambda..."
cd lambda

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "   Installation des dépendances..."
  npm install
fi

# Créer le zip
rm -f ../lambda-deployment-updated.zip
zip -r ../lambda-deployment-updated.zip . \
  -x "*.git*" \
  -x "node_modules/.cache/*" \
  -x "*.zip" \
  -x ".DS_Store" \
  -x "*.log"

cd ..
echo "   ✅ Package créé: lambda-deployment-updated.zip"
echo ""

# 3. Mettre à jour le code Lambda
echo "📤 2. Mise à jour du code Lambda sur AWS..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --zip-file fileb://lambda-deployment-updated.zip \
  --output json > /tmp/lambda-update.json

STATUS=$(cat /tmp/lambda-update.json | grep -o '"LastUpdateStatus":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" = "Successful" ] || [ "$STATUS" = "InProgress" ]; then
  echo "   ✅ Code Lambda mis à jour (Status: $STATUS)"
else
  echo "   ⚠️  Status: $STATUS"
  cat /tmp/lambda-update.json
fi
echo ""

# 4. Attendre que la mise à jour soit complète
if [ "$STATUS" = "InProgress" ]; then
  echo "⏳ Attente de la finalisation de la mise à jour..."
  aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"
  echo "   ✅ Mise à jour complétée"
  echo ""
fi

# 5. Vérifier la version déployée
echo "🔍 3. Vérification de la version déployée..."
aws lambda get-function \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query 'Configuration.[LastModified,CodeSize,Version]' \
  --output table

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Déploiement terminé !"
echo ""
echo "💡 Modifications déployées :"
echo "   - Génération de thumbnails même si vidéo pas dans Neon"
echo "   - Structure de dossiers préservée : thumbnails/Video/groupes-musculaires/{region}/"
echo "   - Vérification d'existence avant génération"
echo ""
echo "🧪 Pour tester, invoquez la Lambda manuellement :"
echo "   node scripts/invoke-lambda-for-all-videos.js"
echo ""
