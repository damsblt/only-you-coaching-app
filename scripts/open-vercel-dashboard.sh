#!/bin/bash

# Script pour ouvrir le dashboard Vercel directement sur la page Storage

echo "🌐 Ouverture du dashboard Vercel..."
echo ""

# Ouvrir le dashboard Storage dans le navigateur
if command -v open &> /dev/null; then
    # macOS
    open "https://vercel.com/dashboard/storage"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "https://vercel.com/dashboard/storage"
elif command -v start &> /dev/null; then
    # Windows
    start "https://vercel.com/dashboard/storage"
else
    echo "❌ Impossible d'ouvrir le navigateur automatiquement"
    echo "   Ouvrez manuellement: https://vercel.com/dashboard/storage"
fi

echo ""
echo "📝 Instructions:"
echo "   1. Cliquez sur 'Create Database'"
echo "   2. Sélectionnez 'Postgres'"
echo "   3. Nom: pilates-app-db"
echo "   4. Région: iad1 (US East)"
echo "   5. Plan: Free"
echo "   6. Cliquez 'Create'"
echo ""

