#!/bin/bash

# Script pour attendre 30 minutes, vérifier l'avancée et synchroniser les thumbnails avec Neon

echo "⏰ Attente de 30 minutes avant vérification..."
echo "   Début: $(date)"
echo ""

# Attendre 30 minutes (1800 secondes)
for i in {1..30}; do
    sleep 60
    echo "   ⏳ $(($i * 60)) secondes écoulées... ($(date +%H:%M:%S))"
done

echo ""
echo "✅ 30 minutes écoulées !"
echo "   Fin: $(date)"
echo ""

# Vérifier si le script est toujours en cours
if ps aux | grep -q "[i]nvoke-lambda-thumbnails.sh"; then
    echo "⚠️  Le script de génération est toujours en cours..."
    echo "   Attente de 5 minutes supplémentaires..."
    sleep 300
fi

echo ""
echo "🔍 Vérification de l'état des thumbnails..."
echo ""

# Lancer le script Node.js de synchronisation
cd "$(dirname "$0")/.."
node scripts/sync-thumbnails-from-s3.js

echo ""
echo "✅ Synchronisation terminée !"
