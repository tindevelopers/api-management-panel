# Vercel Deployment Fix for Turborepo Monorepo

## Problem
Vercel deployment was failing with the error:
```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

This occurred because Vercel was looking for Next.js in the root `package.json`, but in a Turborepo monorepo, Next.js is installed in the workspace package (`apps/web/package.json`).

## Solution

### Option 1: Configure Root Directory in Vercel (RECOMMENDED)

This is the cleanest approach for Turborepo monorepos:

1. **Go to your Vercel project settings**
2. **Navigate to: Settings → General → Root Directory**
3. **Set Root Directory to:** `apps/web`
4. **Keep the default build settings:**
   - Build Command: `next build` (or leave empty for auto-detection)
   - Output Directory: `.next` (or leave empty)
   - Install Command: `npm install` (or leave empty)

This tells Vercel to treat `apps/web` as the project root, where it will find the Next.js dependency.

### Option 2: Use Turborepo Build Commands (ALTERNATIVE)

If you want to build from the monorepo root and leverage Turborepo's caching:

1. **Keep Root Directory as:** `.` (root)
2. **Update `vercel.json` in the root** (already done):
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "cd ../.. && npx turbo run build --filter=web",
     "installCommand": "npm install"
   }
   ```
3. **In Vercel Settings → General:**
   - Root Directory: `apps/web`
   - Build Command: Override with `cd ../.. && npx turbo run build --filter=web`
   - Install Command: Override with `npm install`

### Option 3: Add Next.js to Root package.json (NOT RECOMMENDED)

You could add Next.js to the root `package.json`, but this is not recommended as it:
- Duplicates dependencies
- Goes against monorepo best practices
- Increases bundle size unnecessarily

## Vercel Configuration Files

### Root `vercel.json`
Updated to support Turborepo builds with proper commands.

### `apps/web/vercel.json`
Contains app-specific configuration (headers, redirects, functions).

## Environment Variables

Make sure all environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any other required variables

## Testing the Deployment

After applying the fix:

1. **Trigger a new deployment:**
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push origin develop
   ```

2. **Monitor the build logs** in Vercel dashboard

3. **Expected output:**
   - ✅ Dependencies installed successfully
   - ✅ Next.js version detected
   - ✅ Build completes successfully
   - ✅ Deployment successful

## Troubleshooting

### If build still fails:

1. **Check Root Directory setting** in Vercel project settings
2. **Verify package.json** in `apps/web/` has Next.js in dependencies
3. **Check build logs** for specific error messages
4. **Ensure turbo.json** is properly configured
5. **Try clearing Vercel build cache** in project settings

### Common Issues:

- **"No Next.js version detected"** → Set Root Directory to `apps/web`
- **"Cannot find module 'next'"** → Check install command is running in correct directory
- **Build timeout** → Optimize build command or increase timeout in Vercel settings

## Recommended Approach

**Use Option 1 (Configure Root Directory)** because:
- ✅ Simplest configuration
- ✅ Leverages Vercel's built-in Next.js detection
- ✅ Follows Vercel's recommended practices for monorepos
- ✅ Easier to maintain
- ✅ Better caching and optimization

## Additional Resources

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Turborepo with Vercel](https://turbo.build/repo/docs/handbook/deploying-with-vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Status

- ✅ `vercel.json` updated with Turborepo build commands
- ⏳ Awaiting Vercel Root Directory configuration
- ⏳ Awaiting deployment test

## Next Steps

1. Configure Root Directory in Vercel to `apps/web`
2. Trigger a new deployment
3. Verify successful build and deployment
4. Test the deployed application
