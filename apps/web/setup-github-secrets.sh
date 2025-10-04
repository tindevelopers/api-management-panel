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
echo "1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret with the corresponding value"
echo ""

echo "✅ Supabase Secrets (get from your Supabase dashboard):"
echo "NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY = YOUR_ANON_KEY_HERE"
echo ""

echo "🎯 Get your Supabase credentials from:"
echo "https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api"
echo ""

echo "💡 Note: The deployment job will be skipped until secrets are configured."
echo "   Configure these secrets to enable automated deployments."
