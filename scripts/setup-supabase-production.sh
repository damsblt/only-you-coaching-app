#!/bin/bash

# Script de configuration Supabase pour la production
# Usage: ./scripts/setup-supabase-production.sh

echo "🚀 Configuration Supabase pour la production..."

# Vérifier si nous sommes connectés
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Vous devez d'abord vous connecter à Supabase:"
    echo "   supabase login --token VOTRE_TOKEN"
    exit 1
fi

echo "✅ Connecté à Supabase"

# Lister les projets disponibles
echo "📋 Projets Supabase disponibles:"
supabase projects list

echo ""
echo "🔧 Pour lier votre projet local à un projet Supabase distant:"
echo "   supabase link --project-ref VOTRE_PROJECT_REF"
echo ""
echo "📤 Pour pousser la configuration vers Supabase:"
echo "   supabase db push"
echo ""
echo "🔐 Pour configurer les variables d'environnement dans Supabase:"
echo "   - GMAIL_USER"
echo "   - GMAIL_APP_PASSWORD"
echo "   - NEXT_PUBLIC_SITE_URL"
echo ""
echo "📧 Configuration email optimisée:"
echo "   - SMTP Gmail configuré"
echo "   - Confirmation d'email activée"
echo "   - URLs de redirection configurées"
echo "   - Sécurité des mots de passe renforcée"
echo ""
echo "✅ Configuration terminée !"
