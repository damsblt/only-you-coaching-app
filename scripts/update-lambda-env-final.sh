#!/bin/bash

# Script pour mettre à jour les variables d'environnement Lambda avec Neon
# ARN: arn:aws:lambda:eu-north-1:550368846364:function:only-you-coaching-thumbnail-generator

set -e

FUNCTION_NAME="only-you-coaching-thumbnail-generator"
REGION="eu-north-1"
BUCKET_NAME="only-you-coaching"

echo "🔧 Mise à jour des variables d'environnement Lambda"
echo "===================================================="
echo "📍 Function: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo ""

# Charger DATABASE_URL depuis .env.local
if [ -f .env.local ]; then
    NEON_URL=$(grep -E "^STORAGE_DATABASE_URL=|^DATABASE_URL=" .env.local | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
fi

if [ -z "$NEON_URL" ]; then
    echo "❌ DATABASE_URL ou STORAGE_DATABASE_URL non trouvée dans .env.local"
    echo "   Veuillez vérifier que la variable existe dans .env.local"
    exit 1
fi

echo "✅ Database URL trouvée: ${NEON_URL:0:50}..."
echo ""

# Mettre à jour les variables d'environnement
echo "⏳ Mise à jour des variables d'environnement..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --environment "Variables={S3_BUCKET_NAME=$BUCKET_NAME,AWS_REGION=$REGION,DATABASE_URL=$NEON_URL}" \
  --query 'Environment.Variables' \
  --output table

echo ""
echo "✅ Variables d'environnement mises à jour avec succès!"
echo ""
echo "🧪 Pour tester:"
echo "   aws s3 cp test.mp4 s3://$BUCKET_NAME/Video/test/test.mp4"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo "📊 Vérifier la configuration:"
echo "   aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Environment.Variables'"

