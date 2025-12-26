#!/bin/bash

# Script pour ouvrir Neon SQL Editor

echo "🌐 Ouverture de Neon SQL Editor..."
echo ""

# Ouvrir le dashboard Neon dans le navigateur
if command -v open &> /dev/null; then
    # macOS
    open "https://console.neon.tech"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "https://console.neon.tech"
elif command -v start &> /dev/null; then
    # Windows
    start "https://console.neon.tech"
else
    echo "❌ Impossible d'ouvrir le navigateur automatiquement"
    echo "   Ouvrez manuellement: https://console.neon.tech"
fi

echo ""
echo "📝 Instructions:"
echo "   1. Sélectionnez votre projet"
echo "   2. Cliquez sur 'SQL Editor'"
echo "   3. Copiez le contenu de: scripts/create-all-tables-neon.sql"
echo "   4. Collez dans l'éditeur SQL"
echo "   5. Cliquez sur 'Run'"
echo ""
echo "💡 Ou via Vercel Dashboard:"
echo "   - Allez sur vercel.com/dashboard"
echo "   - Storage → Votre base Neon → Open in Neon Console"
echo ""

