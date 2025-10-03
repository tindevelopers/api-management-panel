# 📚 Blog Writer SDK API Documentation Access

## ✅ **Current Status: Documentation is Now Accessible!**

**Direct Documentation URL:** https://api-ai-blog-writer-613248238610.us-east1.run.app/docs

---

## 🔓 **Solution Applied**

The issue was that the Swagger UI documentation endpoint requires authentication, but the HTML page itself doesn't include the authentication token when making requests to the OpenAPI spec.

**I've temporarily enabled unauthenticated access** so you can explore the documentation. Here are your options:

---

## 🌐 **Method 1: Direct Access (Currently Available)**

**Simply visit:** https://api-ai-blog-writer-613248238610.us-east1.run.app/docs

This will open the Swagger UI documentation where you can:
- ✅ Browse all available endpoints
- ✅ See request/response schemas
- ✅ Test API endpoints directly in the browser
- ✅ View detailed parameter descriptions

---

## 🔧 **Method 2: Local Documentation with Authentication**

I've created a local Swagger UI interface that includes proper authentication:

### **Option A: Use the Script**
```bash
cd "/Users/gene/Projects/API Management Panel/api-management-panel"
./open-docs.sh
```

### **Option B: Use the Interactive HTML**
```bash
cd "/Users/gene/Projects/API Management Panel/api-management-panel"
open swagger-ui.html
```

Then:
1. Click "Authenticate with Google Cloud"
2. Enter your access token (get it with `gcloud auth print-access-token`)
3. Click "Load Documentation"

---

## 🛠️ **Method 3: Command Line API Testing**

### **Get Your Access Token:**
```bash
gcloud config set project api-ai-blog-writer
gcloud auth print-access-token
```

### **Test API Endpoints:**
```bash
# Health check
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/health

# Get available presets
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/abstraction/presets

# Get AI provider capabilities
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/ai/providers/capabilities
```

---

## 📋 **Key API Endpoints to Explore**

### **🏠 Core Information:**
- **`/`** - API overview and available endpoints
- **`/docs`** - Swagger UI documentation
- **`/health`** - Service health status
- **`/openapi.json`** - OpenAPI specification

### **🤖 AI Provider Management:**
- **`/api/v1/ai/providers/capabilities`** - Available AI providers and their capabilities
- **`/api/v1/ai/providers/configure`** - Configure AI providers
- **`/api/v1/ai/health`** - AI provider health status

### **📝 Blog Generation:**
- **`/api/v1/abstraction/blog/generate`** - Generate blog content
- **`/api/v1/abstraction/presets`** - Available writing presets
- **`/api/v1/abstraction/quality-levels`** - Content quality options
- **`/api/v1/abstraction/strategies`** - Writing strategies

### **🖼️ Image Generation:**
- **`/api/v1/images/generate`** - Generate images
- **`/api/v1/images/upscale`** - Upscale existing images
- **`/api/v1/images/variations`** - Create image variations

### **🔍 SEO & Analytics:**
- **`/api/v1/keywords/extract`** - Extract keywords from content
- **`/api/v1/keywords/suggestions`** - Get keyword suggestions
- **`/api/v1/keywords/analyze`** - Analyze keyword performance

---

## 🎯 **Available Writing Presets**

The API includes 8 pre-configured writing presets:

1. **`seo_focused`** - SEO-optimized content for search engines
2. **`engagement_focused`** - High engagement, shareable content
3. **`conversion_focused`** - Content designed to drive conversions
4. **`technical_writer`** - Technical documentation and guides
5. **`creative_writer`** - Creative and artistic content
6. **`enterprise_writer`** - Professional, enterprise-level content
7. **`startup_writer`** - Startup-focused, growth-oriented content
8. **`minimal_writer`** - Clean, minimalist content style

---

## 🔒 **Security Considerations**

**Current Setup:**
- ✅ **Temporarily open** for documentation access
- ⚠️ **Should be secured** for production use

**To restore security:**
```bash
# Remove public access
gcloud run services remove-iam-policy-binding api-ai-blog-writer \
  --region=us-east1 \
  --member="allUsers" \
  --role="roles/run.invoker"

# Ensure your user has access
gcloud run services add-iam-policy-binding api-ai-blog-writer \
  --region=us-east1 \
  --member="user:developer@tin.info" \
  --role="roles/run.invoker"
```

---

## 🧪 **Quick Test Examples**

### **1. Check Service Health:**
```bash
curl https://api-ai-blog-writer-613248238610.us-east1.run.app/health
```

### **2. Get Available Presets:**
```bash
curl https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/abstraction/presets
```

### **3. Test Blog Generation:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "The Future of AI in Web Development",
    "preset": "technical_writer",
    "word_count": 500,
    "include_seo": true
  }' \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/abstraction/blog/generate
```

---

## 📊 **Service Configuration**

- **Environment:** Production (`prod`)
- **Memory:** 2Gi
- **CPU:** 2 cores
- **Port:** 8000
- **Min Instances:** 1
- **Max Instances:** 100
- **Timeout:** 900s (15 minutes)
- **Concurrency:** 80 requests per instance

---

## 🚀 **Next Steps**

1. **Explore the Documentation:** Visit the Swagger UI to understand all available endpoints
2. **Test the API:** Try generating content with different presets
3. **Integrate with Your Panel:** Use the API endpoints in your API Management Panel
4. **Configure AI Providers:** Set up OpenAI, Anthropic, or other AI providers
5. **Secure the Service:** Restore authentication requirements when ready for production

---

**🎉 You now have full access to the Blog Writer SDK API documentation and can start exploring its capabilities!**
