#!/bin/bash

# Script pour corriger les permissions S3 pour les thumbnails avec AWS CLI
# Ce script corrige la bucket policy et désactive "Block public access"

set -e  # Arrêter en cas d'erreur

# Configuration
BUCKET_NAME="only-you-coaching"
REGION="eu-north-1"

# Les credentials AWS doivent être configurés via variables d'environnement
# ou via ~/.aws/credentials
# Exemple: export AWS_ACCESS_KEY_ID="your-key" et export AWS_SECRET_ACCESS_KEY="your-secret"
# Ou utilisez: aws configure

# Vérifier que les credentials sont disponibles
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials non trouvés dans les variables d'environnement"
    echo "   Utilisez: export AWS_ACCESS_KEY_ID=... et export AWS_SECRET_ACCESS_KEY=..."
    echo "   Ou configurez avec: aws configure"
    exit 1
fi

export AWS_DEFAULT_REGION=$REGION

echo "🔧 Correction des permissions S3 pour les thumbnails..."
echo "📦 Bucket: $BUCKET_NAME"
echo "🌍 Region: $REGION"
echo ""

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé. Installez-le avec: brew install awscli"
    exit 1
fi

# Créer le fichier de politique corrigée
POLICY_FILE=$(mktemp)
cat > "$POLICY_FILE" << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/Video/*"
    },
    {
      "Sid": "PublicReadThumbnails",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/thumbnails/*"
    },
    {
      "Sid": "PublicReadPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/Photos/*"
    }
  ]
}
EOF

echo "1️⃣  Application de la bucket policy corrigée..."
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy "file://$POLICY_FILE"

if [ $? -eq 0 ]; then
    echo "   ✅ Bucket policy mise à jour avec succès!"
else
    echo "   ❌ Erreur lors de la mise à jour de la bucket policy"
    rm "$POLICY_FILE"
    exit 1
fi

echo ""
echo "2️⃣  Désactivation de 'Block public access'..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if [ $? -eq 0 ]; then
    echo "   ✅ 'Block public access' désactivé avec succès!"
else
    echo "   ⚠️  Erreur lors de la désactivation de 'Block public access'"
    echo "   Vous devrez peut-être le faire manuellement dans la console S3"
fi

# Nettoyer le fichier temporaire
rm "$POLICY_FILE"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Vérification:"
echo "   Testez une URL de thumbnail:"
echo "   curl -I \"https://$BUCKET_NAME.s3.$REGION.amazonaws.com/thumbnails/Video/programmes-predefinis/cuisses-abdos/74.%20Abduction%20coucher%20sur%20le%20co%CC%82te%CC%81%20%20%2B%20ballon%20cheville-thumb.jpg\""
echo ""
echo "   Vous devriez recevoir 200 OK au lieu de 403 Forbidden."
