#!/bin/bash

echo "🔧 GitHub Secrets Setup Guide for API Management Panel"
echo "=================================================="
echo ""

echo "📋 Required GitHub Secrets:"
echo "1. NEXT_PUBLIC_SUPABASE_URL"
echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. VERCEL_TOKEN (optional)"
echo "4. VERCEL_ORG_ID (optional)"
echo "5. VERCEL_PROJECT_ID (optional)"
echo ""

echo "🔑 Getting Vercel Credentials..."
echo ""

# Get Vercel project info
echo "📊 Current Vercel Project Information:"
vercel project ls 2>/dev/null || echo "⚠️ Please run 'vercel login' first"

echo ""
echo "🏗️ Vercel Organization ID:"
vercel teams ls 2>/dev/null | head -2 || echo "⚠️ Please run 'vercel login' first"

echo ""
echo "🔐 To get Vercel Token:"
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Create a new token"
echo "3. Copy the token value"
echo ""

echo "📝 GitHub Secrets Setup Instructions:"
echo "1. Go to: https://github.com/tindevelopers/api-management-panel/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret with the corresponding value"
echo ""

echo "✅ Supabase Secrets (already configured in Vercel):"
echo "NEXT_PUBLIC_SUPABASE_URL = https://kgaovsovhggehkpntbzu.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w"
echo ""

echo "🎯 Current Production URL:"
echo "https://api-management-panel-mx9z91szb-tindeveloper.vercel.app"
echo ""

echo "💡 Note: The deployment job will be skipped until secrets are configured."
echo "   Your application is already deployed and working via CLI deployment."
