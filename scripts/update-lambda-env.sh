#!/bin/bash

# Script pour mettre à jour les variables d'environnement de la Lambda
# Utilise DATABASE_URL depuis .env.local ou .env.development.local

set -e

FUNCTION_NAME="only-you-coaching-thumbnail-generator"
REGION="eu-north-1"
BUCKET_NAME="only-you-coaching"

echo "🔧 Mise à jour des variables d'environnement Lambda"
echo "===================================================="
echo ""

# Charger les variables d'environnement
if [ -f .env.local ]; then
    while IFS= read -r line; do
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            export "$line"
        fi
    done < .env.local
fi

if [ -f .env.development.local ]; then
    while IFS= read -r line; do
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ "$line" =~ ^[[:space:]]*STORAGE_DATABASE_URL= ]]; then
            export "$line"
        fi
    done < .env.development.local
fi

# Utiliser STORAGE_DATABASE_URL si disponible, sinon DATABASE_URL
NEON_URL="${STORAGE_DATABASE_URL:-${DATABASE_URL}}"

if [ -z "$NEON_URL" ]; then
    echo "❌ DATABASE_URL ou STORAGE_DATABASE_URL manquante"
    exit 1
fi

# Nettoyer l'URL (enlever les guillemets)
NEON_URL=$(echo "$NEON_URL" | tr -d '"' | tr -d "'" | tr -d ' ')

echo "📍 Lambda: $FUNCTION_NAME"
echo "📍 Région: $REGION"
echo "📍 Database: ${NEON_URL:0:50}..."
echo ""

# Mettre à jour les variables d'environnement
echo "⏳ Mise à jour des variables d'environnement..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --environment "Variables={
    S3_BUCKET_NAME=$BUCKET_NAME,
    AWS_REGION=$REGION,
    DATABASE_URL=$NEON_URL
  }" \
  --query 'Environment.Variables' \
  --output table

echo ""
echo "✅ Variables d'environnement mises à jour!"
echo ""
echo "🧪 Pour tester, uploader une vidéo dans S3:"
echo "   aws s3 cp test.mp4 s3://$BUCKET_NAME/Video/test/test.mp4"
echo ""
echo "📊 Vérifier les logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow"

