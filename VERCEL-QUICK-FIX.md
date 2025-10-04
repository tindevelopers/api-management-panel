# Quick Fix: Vercel Deployment Configuration

## The Problem
```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

## The Solution (2 Minutes)

### Step 1: Update Vercel Project Settings

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `api-management-panel`
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)
5. Scroll down to **Root Directory**
6. Click **Edit**
7. Enter: `apps/web`
8. Click **Save**

### Step 2: Trigger Redeploy

Option A - From Vercel Dashboard:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional)
5. Click **Redeploy**

Option B - From Git:
```bash
git commit --allow-empty -m "chore: trigger deployment with new config"
git push origin develop
```

### Step 3: Verify

Watch the build logs. You should see:
- ✅ `Running "vercel build"`
- ✅ `Detected Next.js version: 15.5.4`
- ✅ `Build Completed`

## Why This Works

Your project is a **Turborepo monorepo** with this structure:
```
.
├── apps/
│   └── web/              ← Next.js app is here
│       ├── package.json  ← Next.js dependency is here
│       └── src/
├── packages/
└── package.json          ← Root (no Next.js here)
```

By setting Root Directory to `apps/web`, Vercel:
- Looks for `package.json` in `apps/web/`
- Finds Next.js in dependencies
- Builds successfully

## Alternative: Keep Root Directory as "."

If you prefer to build from the monorepo root:

1. In Vercel Settings → General → Build & Development Settings
2. Override Build Command: `npx turbo run build --filter=web`
3. Override Install Command: `npm install`
4. Root Directory: `apps/web` (still needed for Next.js detection)

## Status

- ✅ `vercel.json` updated
- ⏳ **ACTION REQUIRED:** Update Root Directory in Vercel to `apps/web`
- ⏳ Trigger redeploy

## Expected Result

After configuration:
```
✓ Cloning completed
✓ Running "npm install"
✓ Dependencies installed
✓ Detected Next.js version: 15.5.4
✓ Running "next build"
✓ Build completed successfully
✓ Deployment ready
```

## Need Help?

If the build still fails:
1. Check that Root Directory is set to `apps/web`
2. Verify environment variables are set in Vercel
3. Check build logs for specific errors
4. Try clearing build cache in Vercel settings
