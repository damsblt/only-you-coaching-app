#!/bin/bash

# Script pour vérifier l'accès S3 à la galerie de photos
# Usage: ./scripts/check-s3-gallery-access.sh

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUCKET_NAME="${AWS_S3_BUCKET_NAME:-only-you-coaching}"
REGION="${AWS_REGION:-eu-north-1}"
GALLERY_PATH="Photos/Training/gallery/"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Vérification de l'accès S3 - Galerie${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI n'est pas installé${NC}"
    echo "Installez-le avec: brew install awscli (macOS) ou apt-get install awscli (Linux)"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI est installé${NC}"
echo ""

# Vérifier les credentials AWS
echo -e "${BLUE}1. Vérification des credentials AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Les credentials AWS ne sont pas configurés${NC}"
    echo ""
    echo "Configurez-les avec une des méthodes suivantes:"
    echo "  - aws configure"
    echo "  - Variables d'environnement: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    echo "  - Fichier ~/.aws/credentials"
    exit 1
fi

IDENTITY=$(aws sts get-caller-identity)
echo -e "${GREEN}✅ Credentials AWS configurés${NC}"
echo "   Account: $(echo $IDENTITY | jq -r '.Account' 2>/dev/null || echo 'N/A')"
echo "   User/ARN: $(echo $IDENTITY | jq -r '.Arn' 2>/dev/null || echo 'N/A')"
echo ""

# Vérifier l'accès au bucket
echo -e "${BLUE}2. Vérification de l'accès au bucket '${BUCKET_NAME}'...${NC}"
if ! aws s3 ls "s3://${BUCKET_NAME}" --region "${REGION}" &> /dev/null; then
    echo -e "${RED}❌ Impossible d'accéder au bucket '${BUCKET_NAME}'${NC}"
    echo "   Vérifiez:"
    echo "   - Le nom du bucket est correct"
    echo "   - La région est correcte (${REGION})"
    echo "   - Les credentials ont les permissions s3:ListBucket"
    exit 1
fi

echo -e "${GREEN}✅ Accès au bucket OK${NC}"
echo ""

# Vérifier l'existence du dossier gallery
echo -e "${BLUE}3. Vérification du dossier '${GALLERY_PATH}'...${NC}"
OBJECTS=$(aws s3 ls "s3://${BUCKET_NAME}/${GALLERY_PATH}" --region "${REGION}" 2>&1)

if echo "$OBJECTS" | grep -q "NoSuchKey\|does not exist"; then
    echo -e "${RED}❌ Le dossier '${GALLERY_PATH}' n'existe pas${NC}"
    echo ""
    echo "   Créez le dossier et uploadez des images avec:"
    echo "   aws s3 cp photo.jpg s3://${BUCKET_NAME}/${GALLERY_PATH}photo.jpg"
    exit 1
fi

if [ -z "$OBJECTS" ]; then
    echo -e "${YELLOW}⚠️  Le dossier existe mais est vide${NC}"
    echo ""
    echo "   Uploadez des images avec:"
    echo "   aws s3 cp photo.jpg s3://${BUCKET_NAME}/${GALLERY_PATH}photo.jpg"
else
    IMAGE_COUNT=$(echo "$OBJECTS" | grep -E '\.(jpg|jpeg|png|webp|gif)$' -i | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Dossier trouvé avec ${IMAGE_COUNT} image(s)${NC}"
    echo ""
    echo "   Premières images trouvées:"
    echo "$OBJECTS" | grep -E '\.(jpg|jpeg|png|webp|gif)$' -i | head -5 | while read -r line; do
        FILENAME=$(echo "$line" | awk '{print $4}')
        SIZE=$(echo "$line" | awk '{print $3}')
        echo "   - ${FILENAME} (${SIZE} bytes)"
    done
fi
echo ""

# Vérifier les permissions du bucket
echo -e "${BLUE}4. Vérification des permissions du bucket...${NC}"
BUCKET_POLICY=$(aws s3api get-bucket-policy --bucket "${BUCKET_NAME}" --region "${REGION}" 2>&1 || echo "")

if echo "$BUCKET_POLICY" | grep -q "NoSuchBucketPolicy"; then
    echo -e "${YELLOW}⚠️  Aucune bucket policy configurée${NC}"
    echo "   Les images ne seront pas accessibles publiquement"
    echo "   Configurez une bucket policy pour permettre l'accès public à Photos/*"
elif echo "$BUCKET_POLICY" | grep -q "Photos"; then
    echo -e "${GREEN}✅ Bucket policy trouvée${NC}"
    echo "   La policy semble inclure Photos/*"
else
    echo -e "${YELLOW}⚠️  Bucket policy présente mais ne semble pas inclure Photos/*${NC}"
fi
echo ""

# Vérifier Block Public Access
echo -e "${BLUE}5. Vérification de Block Public Access...${NC}"
BLOCK_PUBLIC=$(aws s3api get-public-access-block --bucket "${BUCKET_NAME}" --region "${REGION}" 2>&1 || echo "")

if [ -z "$BLOCK_PUBLIC" ] || echo "$BLOCK_PUBLIC" | grep -q "NoSuchPublicAccessBlockConfiguration"; then
    echo -e "${GREEN}✅ Block Public Access n'est pas activé${NC}"
    echo "   L'accès public est possible (si la bucket policy le permet)"
else
    BLOCK_ALL=$(echo "$BLOCK_PUBLIC" | jq -r '.PublicAccessBlockConfiguration.BlockPublicAcls' 2>/dev/null || echo "false")
    if [ "$BLOCK_ALL" = "true" ]; then
        echo -e "${YELLOW}⚠️  Block Public Access est activé${NC}"
        echo "   Cela peut empêcher l'accès public même avec une bucket policy"
    else
        echo -e "${GREEN}✅ Block Public Access partiellement désactivé${NC}"
    fi
fi
echo ""

# Tester l'accès public à une image
echo -e "${BLUE}6. Test d'accès public à une image...${NC}"
FIRST_IMAGE=$(echo "$OBJECTS" | grep -E '\.(jpg|jpeg|png|webp|gif)$' -i | head -1 | awk '{print $4}')

if [ -n "$FIRST_IMAGE" ]; then
    PUBLIC_URL="https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${GALLERY_PATH}${FIRST_IMAGE}"
    echo "   Test de l'URL: ${PUBLIC_URL}"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ L'image est accessible publiquement (HTTP ${HTTP_CODE})${NC}"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo -e "${RED}❌ Accès refusé (HTTP 403)${NC}"
        echo "   L'image n'est pas accessible publiquement"
        echo "   Vérifiez la bucket policy et Block Public Access"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${RED}❌ Image non trouvée (HTTP 404)${NC}"
        echo "   Vérifiez que le chemin est correct"
    else
        echo -e "${YELLOW}⚠️  Code HTTP: ${HTTP_CODE}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Aucune image trouvée pour tester${NC}"
fi
echo ""

# Résumé
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Résumé${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Compter les images
TOTAL_IMAGES=$(aws s3 ls "s3://${BUCKET_NAME}/${GALLERY_PATH}" --region "${REGION}" --recursive | grep -E '\.(jpg|jpeg|png|webp|gif)$' -i | wc -l | tr -d ' ')

echo "Bucket: ${BUCKET_NAME}"
echo "Région: ${REGION}"
echo "Dossier: ${GALLERY_PATH}"
echo "Nombre d'images: ${TOTAL_IMAGES}"
echo ""

if [ "$TOTAL_IMAGES" -eq 0 ]; then
    echo -e "${RED}❌ Aucune image trouvée dans la galerie${NC}"
    echo "   Uploadez des images dans: s3://${BUCKET_NAME}/${GALLERY_PATH}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Tout semble correct !${NC}"
    echo "   Les images devraient s'afficher sur le site"
else
    echo -e "${YELLOW}⚠️  Des problèmes de permissions peuvent empêcher l'affichage${NC}"
    echo "   Vérifiez la bucket policy et Block Public Access"
fi

echo ""
