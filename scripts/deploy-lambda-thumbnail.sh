#!/bin/bash

# Script pour déployer la Lambda de génération de thumbnails
# Assurez-vous que la Lambda a une layer avec ffmpeg

set -e

FUNCTION_NAME="only-you-coaching-thumbnail-generator"
REGION="eu-north-1"

echo "🚀 Déploiement de la Lambda de génération de thumbnails..."
echo ""

# 1. Vérifier les variables d'environnement
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL manquant"
  echo "   Chargez-le depuis .env.local:"
  echo "   export DATABASE_URL=\$(grep DATABASE_URL .env.local | cut -d '=' -f2-)"
  exit 1
fi

# 2. Créer le package Lambda
echo "📦 1. Création du package Lambda..."
cd lambda
rm -f ../lambda-deployment.zip
zip -r ../lambda-deployment.zip . -x "*.git*" "node_modules/.cache/*" "*.zip"
cd ..
echo "   ✅ Package créé: lambda-deployment.zip"
echo ""

# 3. Mettre à jour le code Lambda
echo "📤 2. Mise à jour du code Lambda..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --zip-file fileb://lambda-deployment.zip \
  --output json > /dev/null
echo "   ✅ Code Lambda mis à jour"
echo ""

# 4. Mettre à jour les variables d'environnement
echo "⚙️  3. Mise à jour des variables d'environnement..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --environment "Variables={DATABASE_URL=$DATABASE_URL,S3_BUCKET_NAME=only-you-coaching}" \
  --output json > /dev/null
echo "   ✅ Variables d'environnement mises à jour"
echo ""

# 5. Vérifier la configuration
echo "🔍 4. Vérification de la configuration..."
CONFIG=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --output json)

echo "   Function ARN: $(echo $CONFIG | jq -r '.FunctionArn')"
echo "   Runtime: $(echo $CONFIG | jq -r '.Runtime')"
echo "   Timeout: $(echo $CONFIG | jq -r '.Timeout')s"
echo "   Memory: $(echo $CONFIG | jq -r '.MemorySize')MB"
echo ""

# 6. Vérifier les layers (ffmpeg)
LAYERS=$(echo $CONFIG | jq -r '.Layers[]?.Arn // empty')
if [ -z "$LAYERS" ]; then
  echo "⚠️  ATTENTION: Aucune layer détectée!"
  echo "   La Lambda nécessite une layer avec ffmpeg pour générer les thumbnails"
  echo "   Vous pouvez utiliser: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer"
  echo ""
else
  echo "   ✅ Layers détectées:"
  echo "$LAYERS" | while read layer; do
    echo "      - $layer"
  done
  echo ""
fi

echo "✅ Déploiement terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifiez les logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo "   2. Testez en uploadant une vidéo: aws s3 cp test.mp4 s3://only-you-coaching/Video/programmes-predefinis/machine/test.mp4"
echo "   3. Vérifiez que le thumbnail est créé et mis à jour dans Neon"















