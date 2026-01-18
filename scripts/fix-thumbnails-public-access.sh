#!/bin/bash

echo "🔧 Correction des permissions des thumbnails S3..."
echo ""

# Lister tous les thumbnails
THUMBNAILS=$(aws s3 ls s3://only-you-coaching/thumbnails/ --recursive | grep -E '\.(jpg|jpeg|png)$' | awk '{print $4}')

TOTAL=$(echo "$THUMBNAILS" | wc -l | tr -d ' ')
COUNT=0

echo "📊 Trouvé $TOTAL thumbnails à traiter"
echo ""

while IFS= read -r thumbnail; do
    if [ -z "$thumbnail" ]; then
        continue
    fi
    
    COUNT=$((COUNT + 1))
    
    # Mettre à jour les métadonnées pour rendre l'objet public
    aws s3api copy-object \
        --bucket only-you-coaching \
        --copy-source "only-you-coaching/${thumbnail}" \
        --key "$thumbnail" \
        --metadata-directive REPLACE \
        --cache-control "max-age=31536000" \
        --content-type "image/jpeg" \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        if [ $((COUNT % 50)) -eq 0 ]; then
            echo "   ✅ $COUNT/$TOTAL traités..."
        fi
    fi
done <<< "$THUMBNAILS"

echo ""
echo "✅ Tous les thumbnails ont été mis à jour!"
echo "🧪 Test d'accès:"
curl -I "https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/Video/groupes-musculaires/streching/16.%20Adducteur%20assis%20au%20sol%20%2B%201%20jambe%20tendue%20et%20un%20genou%20fl%C3%A9chi-thumb.jpg" 2>&1 | head -3
