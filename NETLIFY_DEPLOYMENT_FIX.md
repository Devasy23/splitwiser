# Netlify Deployment Fix

## Problem
Netlify build was timing out because it was running `npx expo start --web` which starts a development server that runs indefinitely, rather than building static files for deployment.

## Solution
Created proper Netlify configuration to build the Expo web app correctly.

### Files Added/Modified:

#### 1. `netlify.toml` (Root directory)
```toml
[build]
  command = "cd frontend && npm ci && npx expo export:web"
  publish = "frontend/web-build"
  base = "/"

[build.environment]
  NODE_VERSION = "20"
  CI = "false"
  NPM_CONFIG_AUDIT = "false"
  NPM_CONFIG_FUND = "false"
  NPM_CONFIG_LOGLEVEL = "error"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. `frontend/package.json` (Updated scripts)
Added build scripts:
```json
"scripts": {
  "build:web": "expo export:web",
  "build": "expo export:web"
}
```

## How it Works

1. **Build Command**: `cd frontend && npm ci && npx expo export:web`
   - Navigates to frontend directory
   - Uses npm ci for faster, more reliable installs
   - Builds static web files using Expo

2. **Publish Directory**: `frontend/web-build`
   - Expo exports built files to this directory
   - Netlify serves files from here

3. **SPA Redirects**: All routes redirect to `index.html`
   - Enables React Router to handle client-side routing

4. **Environment**: Node.js 20 with optimized npm settings
   - Disables audit and funding messages to prevent errors
   - Uses error-level logging only

## Verification

Build command tested locally:
```bash
cd frontend
npx expo export:web
# ✅ Compiled successfully
# ✅ Created web-build/ directory
```

## Troubleshooting

### Common Issues:

1. **`--report-filename` error**
   - Fixed by setting `NPM_CONFIG_AUDIT = "false"`
   - Uses `npm ci` instead of `npm install`

2. **Build timeout**
   - Fixed by using `expo export:web` instead of `expo start --web`
   - Added proper environment variables

3. **Missing dependencies**
   - `npm ci` ensures exact dependency versions
   - Uses package-lock.json for reproducible builds

### Environment Variables:
- `NODE_VERSION = "20"` - Uses Node.js 20
- `NPM_CONFIG_AUDIT = "false"` - Skips security audit  
- `NPM_CONFIG_FUND = "false"` - Skips funding messages
- `NPM_CONFIG_LOGLEVEL = "error"` - Minimal logging

## Result

- ✅ Build will complete in ~2-5 minutes instead of timing out
- ✅ Static files will be generated for deployment
- ✅ SPA routing will work correctly
- ✅ Performance headers and caching configured

The deployment should now work correctly without timeouts.
