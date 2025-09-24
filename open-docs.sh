#!/bin/bash

# Blog Writer SDK API Documentation Opener
# This script helps you access the protected API documentation

echo "🚀 Blog Writer SDK API Documentation Opener"
echo "============================================="
echo

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI (gcloud) is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ You are not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the correct project
echo "📋 Setting project to api-ai-blog-writer..."
gcloud config set project api-ai-blog-writer

# Get the access token
echo "🔑 Getting access token..."
ACCESS_TOKEN=$(gcloud auth print-access-token)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token. Please check your authentication."
    exit 1
fi

echo "✅ Access token obtained successfully!"
echo

# Test the API
echo "🧪 Testing API access..."
API_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    https://api-ai-blog-writer-613248238610.us-east1.run.app/health)

if echo "$API_RESPONSE" | grep -q "healthy"; then
    echo "✅ API is accessible and healthy!"
else
    echo "⚠️  API test failed. Response: $API_RESPONSE"
fi

echo
echo "📚 Opening documentation..."

# Create a temporary HTML file with the token
TEMP_HTML="/tmp/blog-writer-docs-$$.html"
cat > "$TEMP_HTML" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Writer SDK API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        const ui = SwaggerUIBundle({
            url: 'https://api-ai-blog-writer-613248238610.us-east1.run.app/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            requestInterceptor: function(request) {
                request.headers['Authorization'] = 'Bearer $ACCESS_TOKEN';
                return request;
            },
            onComplete: function() {
                console.log('✅ Swagger UI loaded successfully with authentication!');
            },
            onFailure: function(error) {
                console.error('❌ Failed to load Swagger UI:', error);
                alert('Failed to load API documentation. Please check your authentication.');
            }
        });
    </script>
</body>
</html>
EOF

# Open the documentation
if command -v open &> /dev/null; then
    # macOS
    open "$TEMP_HTML"
    echo "✅ Documentation opened in your default browser!"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "$TEMP_HTML"
    echo "✅ Documentation opened in your default browser!"
elif command -v start &> /dev/null; then
    # Windows
    start "$TEMP_HTML"
    echo "✅ Documentation opened in your default browser!"
else
    echo "📄 Please open this file in your browser: $TEMP_HTML"
fi

echo
echo "🔧 Alternative Methods:"
echo "======================="
echo "1. Direct curl with authentication:"
echo "   curl -H \"Authorization: Bearer $ACCESS_TOKEN\" \\"
echo "        https://api-ai-blog-writer-613248238610.us-east1.run.app/health"
echo
echo "2. Use the interactive Swagger UI:"
echo "   Open: swagger-ui.html in your browser and authenticate"
echo
echo "3. Get fresh token anytime:"
echo "   gcloud auth print-access-token"
echo
echo "🎉 Happy API exploring!"
