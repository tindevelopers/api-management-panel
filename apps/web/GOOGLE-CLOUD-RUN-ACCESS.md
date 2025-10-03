# 🚀 Google Cloud Run API Access Guide

## ✅ **Successfully Accessed: Blog Writer SDK API**

**Service URL:** https://api-ai-blog-writer-613248238610.us-east1.run.app/

---

## 🔐 **Authentication Setup**

### **Current Access Status:**
- ✅ **Authenticated User:** `developer@tin.info`
- ✅ **Project:** `api-ai-blog-writer` (ID: 613248238610)
- ✅ **Region:** `us-east1`
- ✅ **Permissions:** `roles/run.admin` + `roles/run.invoker`

### **How to Access:**

#### **1. Using Google Cloud CLI:**
```bash
# Authenticate (if not already done)
gcloud auth login

# Set the project
gcloud config set project api-ai-blog-writer

# Get access token
gcloud auth print-access-token

# Access the API with authentication
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/
```

#### **2. Using Service Account (for applications):**
```bash
# Create service account key
gcloud iam service-accounts create blog-writer-client \
  --display-name="Blog Writer API Client"

# Grant necessary permissions
gcloud projects add-iam-policy-binding api-ai-blog-writer \
  --member="serviceAccount:blog-writer-client@api-ai-blog-writer.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Create and download key
gcloud iam service-accounts keys create blog-writer-key.json \
  --iam-account=blog-writer-client@api-ai-blog-writer.iam.gserviceaccount.com

# Use in applications
export GOOGLE_APPLICATION_CREDENTIALS="blog-writer-key.json"
```

---

## 📋 **Available API Endpoints**

### **🏠 Core Endpoints:**
- **`/`** - API information and available endpoints
- **`/docs`** - Swagger UI documentation
- **`/health`** - Health check
- **`/ready`** - Readiness check
- **`/live`** - Liveness check

### **🤖 AI Provider Management:**
- **`/api/v1/ai/providers/capabilities`** - Get provider capabilities
- **`/api/v1/ai/providers/configure`** - Configure AI provider
- **`/api/v1/ai/providers/bulk-configure`** - Bulk configure providers
- **`/api/v1/ai/health`** - AI provider health status

### **📝 Blog Generation:**
- **`/api/v1/abstraction/blog/generate`** - Generate blog content
- **`/api/v1/abstraction/presets`** - Get available presets
- **`/api/v1/abstraction/quality-levels`** - Get quality levels
- **`/api/v1/abstraction/strategies`** - Get writing strategies
- **`/api/v1/abstraction/status`** - Get abstraction status

### **🖼️ Image Generation:**
- **`/api/v1/images/generate`** - Generate images
- **`/api/v1/images/upscale`** - Upscale images
- **`/api/v1/images/variations`** - Create image variations
- **`/api/v1/images/providers`** - Get image provider status

### **🔍 SEO & Analytics:**
- **`/api/v1/keywords/extract`** - Extract keywords
- **`/api/v1/keywords/suggestions`** - Get keyword suggestions
- **`/api/v1/keywords/analyze`** - Analyze keywords
- **`/api/v1/metrics`** - Get system metrics

### **📦 Batch Operations:**
- **`/api/v1/batch/generate`** - Create batch generation job
- **`/api/v1/batch/{job_id}/status`** - Get batch status
- **`/api/v1/batch/{job_id}/stream`** - Stream batch results
- **`/api/v1/batch`** - List batch jobs

---

## 🎯 **Available Writing Presets**

The API includes several pre-configured writing presets:

1. **`seo_focused`** - SEO-optimized content
2. **`engagement_focused`** - High engagement content
3. **`conversion_focused`** - Conversion-optimized content
4. **`technical_writer`** - Technical documentation
5. **`creative_writer`** - Creative content
6. **`enterprise_writer`** - Enterprise-level content
7. **`startup_writer`** - Startup-focused content
8. **`minimal_writer`** - Minimalist content

---

## 🔧 **Supported AI Providers**

### **Text Generation:**
- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Azure OpenAI** - Azure-hosted OpenAI models

### **Image Generation:**
- **Stability AI** - Stable Diffusion models
- **OpenAI DALL-E** - DALL-E models
- **Midjourney** - Midjourney integration
- **Replicate** - Various models
- **Hugging Face** - Open source models

---

## 📊 **Service Configuration**

### **Current Setup:**
- **Environment:** `prod`
- **Memory:** 2Gi
- **CPU:** 2 cores
- **Port:** 8000
- **Min Instances:** 1
- **Max Instances:** 100
- **Timeout:** 900s (15 minutes)
- **Concurrency:** 80 requests per instance

### **Environment Variables:**
- **`ENVIRONMENT=prod`**
- **`PYTHONUNBUFFERED=1`**
- **Secrets:** `blog-writer-env-prod` (contains API keys and configuration)

---

## 🧪 **Testing the API**

### **1. Basic Health Check:**
```bash
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/health
```

### **2. Get Available Presets:**
```bash
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/abstraction/presets
```

### **3. Check AI Provider Capabilities:**
```bash
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/ai/providers/capabilities
```

### **4. Generate Blog Content (Example):**
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "The Future of AI in Web Development",
    "preset": "technical_writer",
    "word_count": 1000,
    "include_seo": true
  }' \
  https://api-ai-blog-writer-613248238610.us-east1.run.app/api/v1/abstraction/blog/generate
```

---

## 🔒 **Security Notes**

- ✅ **Authentication Required:** All endpoints require valid Google Cloud authentication
- ✅ **HTTPS Only:** Service only accepts HTTPS requests
- ✅ **Rate Limited:** Built-in rate limiting and quota management
- ✅ **Audit Logging:** All requests are logged in Google Cloud Logging
- ✅ **IAM Controlled:** Access controlled via Google Cloud IAM

---

## 📚 **Documentation**

- **Swagger UI:** https://api-ai-blog-writer-613248238610.us-east1.run.app/docs
- **OpenAPI Spec:** https://api-ai-blog-writer-613248238610.us-east1.run.app/openapi.json
- **Health Check:** https://api-ai-blog-writer-613248238610.us-east1.run.app/health

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **401 Unauthorized:**
   - Ensure you're authenticated: `gcloud auth list`
   - Check your access token: `gcloud auth print-access-token`
   - Verify IAM permissions: `gcloud run services get-iam-policy api-ai-blog-writer --region=us-east1`

2. **403 Forbidden:**
   - Check if you have `roles/run.invoker` permission
   - Verify you're using the correct project: `gcloud config get-value project`

3. **Service Not Responding:**
   - Check service status: `gcloud run services describe api-ai-blog-writer --region=us-east1`
   - View logs: `gcloud logging read "resource.type=cloud_run_revision" --limit=10`

---

**🎉 Your Google Cloud Run Blog Writer SDK API is now fully accessible and ready for use!**
