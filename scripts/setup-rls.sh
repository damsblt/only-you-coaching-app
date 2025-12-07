#!/bin/bash

# 🛡️ RLS Setup Script for Pilates App
# This script helps you set up Row Level Security in your Supabase project

set -e

echo "🛡️  RLS Setup Script for Pilates App"
echo "====================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    exit 1
fi

# Load environment variables
source .env.local

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure .env.local contains:"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js to run the test script"
    exit 1
fi

echo "✅ Node.js found"
echo ""

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies ready"
echo ""

echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. 📋 Apply RLS Policies:"
echo "   - Go to your Supabase Dashboard: https://app.supabase.com"
echo "   - Select your project"
echo "   - Go to SQL Editor"
echo "   - Copy and paste the contents of 'supabase-rls-setup.sql'"
echo "   - Click 'Run' to apply the policies"
echo ""
echo "2. 🧪 Test the Implementation:"
echo "   Run: node scripts/test-rls-policies.js"
echo ""
echo "3. 📖 Read the Guide:"
echo "   Open: RLS_IMPLEMENTATION_GUIDE.md"
echo ""

# Ask if user wants to run the test script
read -p "Would you like to run the RLS test script now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧪 Running RLS Test Script..."
    echo "============================="
    echo ""
    
    if node scripts/test-rls-policies.js; then
        echo ""
        echo "✅ RLS tests completed successfully!"
        echo "Your RLS policies are working correctly."
    else
        echo ""
        echo "❌ Some RLS tests failed."
        echo "Please check the output above and ensure you've applied the RLS policies."
    fi
else
    echo ""
    echo "ℹ️  You can run the test script later with:"
    echo "   node scripts/test-rls-policies.js"
fi

echo ""
echo "🎉 RLS setup script completed!"
echo ""
echo "📚 For more information, see:"
echo "   - RLS_IMPLEMENTATION_GUIDE.md"
echo "   - supabase-rls-setup.sql"
echo "   - scripts/test-rls-policies.js"
