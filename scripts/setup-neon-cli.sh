#!/bin/bash

# Script pour installer et configurer Neon CLI

echo "🚀 Installation de Neon CLI..."
echo ""

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Installer Neon CLI globalement
echo "📦 Installation de @neonctl/cli..."
npm install -g @neonctl/cli

# Vérifier l'installation
if command -v neonctl &> /dev/null; then
    echo "✅ Neon CLI installé avec succès"
    echo ""
    echo "🔐 Configuration du token..."
    export NEON_API_KEY="napi_ucev18yboa60xdslc8d4uil0dw5u48ja0amm2itq8t0oq0xn76sgot0f6yavv2jl"
    
    # Tester la connexion
    echo "🧪 Test de connexion..."
    neonctl projects list --api-key="$NEON_API_KEY" || {
        echo "⚠️  Erreur de connexion. Vérifiez le token."
        exit 1
    }
    
    echo ""
    echo "✅ Configuration terminée!"
    echo ""
    echo "💡 Pour utiliser Neon CLI:"
    echo "   export NEON_API_KEY=\"napi_ucev18yboa60xdslc8d4uil0dw5u48ja0amm2itq8t0oq0xn76sgot0f6yavv2jl\""
    echo "   neonctl projects list"
else
    echo "❌ Échec de l'installation"
    exit 1
fi

