#!/bin/bash

# Script pour invoquer la Lambda AWS pour générer les thumbnails
# pour toutes les vidéos sans thumbnail

echo "🚀 Génération des thumbnails via Lambda AWS..."
echo ""

# Lister tous les fichiers vidéo dans groupes-musculaires
echo "📋 Récupération de la liste des vidéos depuis S3..."

REGIONS=("dos" "pectoraux" "abdos" "biceps" "triceps" "epaules" "streching" "cardio" "bande")

TOTAL_COUNT=0
SUCCESS_COUNT=0
ERROR_COUNT=0

for REGION in "${REGIONS[@]}"; do
    echo ""
    echo "📦 Région: $REGION"
    echo "----------------------------------------"
    
    # Lister les vidéos de cette région (utiliser s3api pour avoir les clés complètes)
    VIDEOS=$(aws s3api list-objects-v2 \
        --bucket only-you-coaching \
        --prefix "Video/groupes-musculaires/${REGION}/" \
        --query 'Contents[?Size>`0`].Key' \
        --output text | tr '\t' '\n' | grep -E '\.(mp4|mov|avi)$')
    
    if [ -z "$VIDEOS" ]; then
        echo "⏭️  Aucune vidéo trouvée"
        continue
    fi
    
    REGION_COUNT=0
    while IFS= read -r VIDEO_KEY; do
        if [ -z "$VIDEO_KEY" ]; then
            continue
        fi
        
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        REGION_COUNT=$((REGION_COUNT + 1))
        
        # URL-encoder la clé (espaces -> +, caractères spéciaux -> %XX)
        ENCODED_KEY=$(echo -n "$VIDEO_KEY" | jq -sRr @uri | sed 's/%2F/\//g')
        
        # Créer le payload S3 event avec jq pour un JSON valide
        PAYLOAD=$(jq -n \
          --arg bucket "only-you-coaching" \
          --arg key "$ENCODED_KEY" \
          '{
            "Records": [
              {
                "eventVersion": "2.1",
                "eventSource": "aws:s3",
                "eventName": "ObjectCreated:Put",
                "s3": {
                  "bucket": {
                    "name": $bucket
                  },
                  "object": {
                    "key": $key
                  }
                }
              }
            ]
          }'
        )
        
        # Invoquer la Lambda
        echo -n "[$REGION_COUNT] $(basename "$VIDEO_KEY") ... "
        
        RESPONSE=$(aws lambda invoke \
            --function-name only-you-coaching-thumbnail-generator \
            --invocation-type RequestResponse \
            --payload "$PAYLOAD" \
            --cli-binary-format raw-in-base64-out \
            /tmp/lambda-response.json 2>&1)
        
        if [ $? -eq 0 ]; then
            # Vérifier le code de statut dans la réponse
            STATUS_CODE=$(jq -r '.statusCode' /tmp/lambda-response.json 2>/dev/null)
            if [ "$STATUS_CODE" = "200" ]; then
                echo "✅"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "❌ (Status: $STATUS_CODE)"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi
        else
            echo "❌ (Erreur Lambda)"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
        
        # Attendre 2 secondes entre chaque invocation
        sleep 2
        
        # Afficher le progrès tous les 10 videos
        if [ $((REGION_COUNT % 10)) -eq 0 ]; then
            echo ""
            echo "   📊 Progrès région: $REGION_COUNT vidéos | ✅ $SUCCESS_COUNT | ❌ $ERROR_COUNT"
            echo ""
        fi
        
    done <<< "$VIDEOS"
    
    echo "✓ $REGION: $REGION_COUNT vidéos traitées"
done

echo ""
echo "============================================================"
echo "📊 RÉSUMÉ FINAL"
echo "============================================================"
echo "   Total traité: $TOTAL_COUNT"
echo "   ✅ Succès: $SUCCESS_COUNT"
echo "   ❌ Erreurs: $ERROR_COUNT"
echo "============================================================"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ Génération terminée!"
    echo "💡 Vérifiez les thumbnails: s3://only-you-coaching/thumbnails/Video/groupes-musculaires/"
    echo ""
fi
