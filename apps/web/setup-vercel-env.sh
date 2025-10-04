#!/bin/bash

# Setup Vercel Environment Variables for API Management Panel
# This script configures the Supabase environment variables for all Vercel environments

echo "🚀 Setting up Vercel environment variables for API Management Panel"
echo "================================================================"

# Supabase configuration - REPLACE WITH YOUR ACTUAL VALUES
SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"
APP_URL="https://your-app.vercel.app"

echo ""
echo "⚠️  IMPORTANT: Update the variables above with your actual Supabase credentials"
echo "   Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api"
echo ""

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environment=$3

    echo "📝 Adding $var_name for $environment environment..."

    # Use printf to provide the value to vercel env add
    printf "%s" "$var_value" | vercel env add "$var_name" "$environment"

    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $var_name for $environment"
    else
        echo "❌ Failed to add $var_name for $environment"
        return 1
    fi
}

# Add environment variables for preview environment (includes develop branch)
echo ""
echo "🔧 Configuring Preview Environment (includes develop branch)..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
add_env_var "NEXT_PUBLIC_APP_URL" "$APP_URL" "preview"

# Add environment variables for development environment
echo ""
echo "🔧 Configuring Development Environment..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "development"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "development"
add_env_var "NEXT_PUBLIC_APP_URL" "$APP_URL" "development"

echo ""
echo "🎉 Environment variables setup complete!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "✅ Preview environment configured (for develop branch)"
echo "✅ Development environment configured"
echo ""
echo "🔍 Next Steps:"
echo "1. Verify the environment variables in Vercel Dashboard"
echo "2. Trigger a new deployment to apply the changes"
echo "3. Test the application on the preview URL"
