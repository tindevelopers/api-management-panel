# 🌿 Branching Strategy

## Branch Overview

Our repository uses a **three-branch Git workflow** for organized development and deployment:

### 🏗️ **Branch Structure:**

```
main (production)
├── staging (pre-production)
└── develop (development)
```

## 📋 **Branch Descriptions:**

### 🌟 **main** (Production)
- **Purpose:** Production-ready code
- **Deployment:** Auto-deploys to production Vercel
- **Access:** Protected branch (requires PR)
- **CI/CD:** Full testing + production deployment
- **URL:** https://api-management-panel.vercel.app

### 🚀 **staging** (Pre-Production)
- **Purpose:** Pre-production testing environment
- **Deployment:** Auto-deploys to staging Vercel
- **Access:** Protected branch (requires PR)
- **CI/CD:** Full testing + staging deployment
- **URL:** https://api-management-panel-staging.vercel.app

### 🛠️ **develop** (Development)
- **Purpose:** Active development branch
- **Deployment:** Auto-deploys to preview Vercel
- **Access:** Open for feature development
- **CI/CD:** Full testing + preview deployment
- **URL:** https://api-management-panel-develop.vercel.app

## 🔄 **Workflow Process:**

### 1. **Feature Development:**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: add your feature"

# Push feature branch
git push origin feature/your-feature-name

# Create PR to develop branch
```

### 2. **Integration to Staging:**
```bash
# Create PR from develop to staging
# After review and approval, merge develop → staging
```

### 3. **Production Release:**
```bash
# Create PR from staging to main
# After final review and approval, merge staging → main
```

## 🚦 **CI/CD Pipeline by Branch:**

### **main branch:**
- ✅ ESLint + TypeScript checks
- ✅ Security audit
- ✅ Multi-Node testing (18.x, 20.x)
- ✅ **Production deployment to Vercel**
- ✅ Full environment variables

### **staging branch:**
- ✅ ESLint + TypeScript checks
- ✅ Security audit
- ✅ Multi-Node testing (18.x, 20.x)
- ✅ **Staging deployment to Vercel**
- ✅ Full environment variables

### **develop branch:**
- ✅ ESLint + TypeScript checks
- ✅ Security audit
- ✅ Multi-Node testing (18.x, 20.x)
- ✅ **Preview deployment to Vercel**
- ✅ Full environment variables

## 🛡️ **Branch Protection Rules:**

### **main & staging branches:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to maintainers

### **develop branch:**
- ✅ Require status checks to pass
- ✅ Allow direct pushes for active development

## 📊 **Environment Variables:**

All branches use the same environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🔧 **Quick Commands:**

### **Switch between branches:**
```bash
git checkout main      # Switch to production
git checkout staging   # Switch to staging
git checkout develop   # Switch to development
```

### **Create feature branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### **Sync with remote:**
```bash
git pull origin main
git pull origin staging
git pull origin develop
```

### **Push new branches:**
```bash
git push origin your-new-branch
```

## 🎯 **Best Practices:**

1. **Always start features from `develop`**
2. **Test thoroughly in `staging` before production**
3. **Use descriptive commit messages**
4. **Create PRs for code review**
5. **Keep branches up to date**
6. **Delete feature branches after merge**

## 📈 **Deployment URLs:**

- **Production:** https://api-management-panel.vercel.app
- **Staging:** https://api-management-panel-staging.vercel.app
- **Development:** https://api-management-panel-develop.vercel.app

---

**🎉 This branching strategy ensures safe, organized development with proper testing at each stage!**
