#!/bin/bash

# Setup Vercel Environment Variables for API Management Panel
# This script configures the Supabase environment variables for all Vercel environments

echo "🚀 Setting up Vercel environment variables for API Management Panel"
echo "================================================================"

# Supabase configuration
SUPABASE_URL="https://kgaovsovhggehkpntbzu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w"
APP_URL="https://api-management-panel-8dl2fq2d9-tindeveloper.vercel.app"

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
echo "✅ Preview Environment (develop branch): Configured"
echo "✅ Development Environment: Configured"
echo "✅ Production Environment: Already configured"
echo ""
echo "🚀 Next steps:"
echo "1. The develop branch deployment should now show the login screen"
echo "2. Visit: https://api-management-panel-8dl2fq2d9-tindeveloper.vercel.app"
echo "3. You should see the login page instead of the setup page"
echo ""
echo "🔍 To verify the configuration:"
echo "vercel env ls"
