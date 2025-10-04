#!/bin/bash

# 🚀 API Management Panel - Quick Setup Script
# This script helps you set up the project quickly using Supabase CLI

echo "🚀 API Management Panel - Quick Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    echo "   Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Node.js, npm, and Supabase CLI are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Function to setup environment with Supabase CLI
setup_supabase_env() {
    echo "🔗 Setting up Supabase environment..."

    # Check if project is already linked
    if [ -f "supabase/config.toml" ]; then
        echo "✅ Supabase project already linked"
    else
        echo "🔗 Linking to Supabase project..."
        read -p "Enter your Supabase project reference ID: " PROJECT_REF

        if [ -z "$PROJECT_REF" ]; then
            echo "❌ Project reference ID is required"
            return 1
        fi

        supabase link --project-ref "$PROJECT_REF"

        if [ $? -ne 0 ]; then
            echo "❌ Failed to link Supabase project"
            return 1
        fi
    fi

    # Get project reference from config
    PROJECT_REF=$(grep 'project_id' supabase/config.toml | cut -d'"' -f2)

    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Could not determine project reference ID"
        return 1
    fi

    echo "📝 Generating environment variables for project: $PROJECT_REF"

    # Get API keys using Supabase CLI
    API_KEYS_OUTPUT=$(supabase projects api-keys --project-ref "$PROJECT_REF" 2>/dev/null)

    if [ $? -ne 0 ]; then
        echo "❌ Failed to get API keys from Supabase"
        return 1
    fi

    # Extract anon key
    ANON_KEY=$(echo "$API_KEYS_OUTPUT" | grep "anon" | awk '{print $3}')

    if [ -z "$ANON_KEY" ]; then
        echo "❌ Could not extract anon key"
        return 1
    fi

    # Create .env.local with actual credentials
    cat > .env.local << EOF
# Supabase Configuration
# Generated using Supabase CLI for project: $PROJECT_REF
NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Development Configuration
NODE_ENV=development

# Optional: Logging Configuration
# LOG_REQUESTS=true
# LOG_RESPONSES=false
# LOG_ERRORS=true
# LOG_PERFORMANCE=false
# LOG_AUDIT=true

# Optional: CORS Configuration
# CORS_ORIGINS=http://localhost:3000,http://localhost:3001
# CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
# CORS_HEADERS=Content-Type,Authorization
# CORS_CREDENTIALS=true
EOF

    echo "✅ Environment variables configured successfully"
    return 0
}

# Check if .env.local exists and has valid credentials
if [ -f ".env.local" ] && ! grep -q "your_supabase_project_url_here" .env.local 2>/dev/null; then
    echo "✅ .env.local already exists with valid credentials"
else
    echo "📝 Setting up environment variables..."

    # Try automatic setup with Supabase CLI
    if setup_supabase_env; then
        echo "✅ Automatic setup completed"
    else
        echo "⚠️  Automatic setup failed. Creating template..."
        cp .env.example .env.local
        echo "📝 Please manually update .env.local with your Supabase credentials"
        echo "   1. Go to https://supabase.com/dashboard"
        echo "   2. Select your project"
        echo "   3. Go to Settings → API"
        echo "   4. Copy your Project URL and anon key"
        echo "   5. Update the values in .env.local"
    fi
fi

echo ""
echo "🗄️  Database Setup Required:"
echo "   1. Go to your Supabase project dashboard"
echo "   2. Navigate to SQL Editor"
echo "   3. Copy and paste the contents of 'supabase-schema.sql'"
echo "   4. Click 'Run' to execute the schema"
echo ""

echo "🎉 Setup complete! Next steps:"
echo "   1. Verify your Supabase credentials in .env.local"
echo "   2. Run the database schema in Supabase SQL Editor"
echo "   3. Start the development server: npm run dev"
echo "   4. Open http://localhost:3001 in your browser"
echo ""
echo "📖 For detailed instructions, see LOCAL-SETUP-GUIDE.md"