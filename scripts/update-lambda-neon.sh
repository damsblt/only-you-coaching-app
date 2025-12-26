#!/bin/bash

# Script pour mettre à jour la Lambda avec Neon
# Utilise les credentials AWS configurés dans l'environnement

set -e

FUNCTION_NAME="only-you-coaching-thumbnail-generator"
REGION="eu-north-1"
BUCKET_NAME="only-you-coaching"

echo "🔧 Mise à jour de la Lambda pour Neon"
echo "======================================"
echo ""

# Charger DATABASE_URL depuis .env.development.local
if [ -f .env.development.local ]; then
    NEON_URL=$(grep "^STORAGE_DATABASE_URL=" .env.development.local | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
fi

if [ -z "$NEON_URL" ]; then
    echo "❌ STORAGE_DATABASE_URL non trouvée dans .env.development.local"
    exit 1
fi

echo "📍 Lambda: $FUNCTION_NAME"
echo "📍 Région: $REGION"
echo "📍 Database: ${NEON_URL:0:50}..."
echo ""

# Mettre à jour le code Lambda
if [ -f lambda-deployment.zip ]; then
    echo "📦 Mise à jour du code Lambda..."
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --region "$REGION" \
      --zip-file fileb://lambda-deployment.zip \
      --query 'LastUpdateStatus' \
      --output text
    echo "✅ Code mis à jour"
    echo ""
else
    echo "⚠️  lambda-deployment.zip non trouvé, création du package..."
    cd lambda
    npm install
    zip -r ../lambda-deployment.zip . -x "*.git*" "node_modules/.cache/*" "*.zip"
    cd ..
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --region "$REGION" \
      --zip-file fileb://lambda-deployment.zip \
      --query 'LastUpdateStatus' \
      --output text
    echo "✅ Code mis à jour"
    echo ""
fi

# Mettre à jour les variables d'environnement
echo "🔐 Mise à jour des variables d'environnement..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --environment "Variables={S3_BUCKET_NAME=$BUCKET_NAME,AWS_REGION=$REGION,DATABASE_URL=$NEON_URL}" \
  --query 'Environment.Variables' \
  --output table

echo ""
echo "✅ Lambda mise à jour avec succès!"
echo ""
echo "🧪 Pour tester:"
echo "   aws s3 cp test.mp4 s3://$BUCKET_NAME/Video/test/test.mp4"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow"

