# GitHub Pages Deployment Guide

This document explains how to deploy a Qwik application to GitHub Pages, including all the configuration needed to handle the repository-specific base path.

## Overview

GitHub Pages serves your site at `https://<username>.github.io/<repository-name>/`, which means all resources need to be served from a subdirectory path (e.g., `/qwik-lens/` instead of `/`). This requires proper base path configuration throughout your application.

## Required Configuration

### 1. Vite Configuration

**Both** the main Vite config and the SSG adapter config need the `base` path set.

#### `vite.config.ts` (Main Config)

Add the `base` property to your main Vite configuration:

```typescript
export default defineConfig(({ command, mode }): UserConfig => {
  return {
    // Base path for GitHub Pages deployment
    base: "/qwik-lens/",  // Replace with your repository name
    
    plugins: [
      qwikRouter(),
      qwikVite(),
      tsconfigPaths({ root: "." }),
    ],
    // ... rest of config
  };
});
```

**Why this is needed:** The client build (`vite build`) uses this config, and `import.meta.env.BASE_URL` is evaluated at build time. Without this, all resource paths will be absolute from root.

#### `adapters/static/vite.config.ts` (SSG Adapter Config)

```typescript
export default extendConfig(baseConfig, () => {
  return {
    // This is crucial for GitHub Pages
    base: "/qwik-lens/",  // Replace with your repository name

    build: {
      ssr: true,
      rollupOptions: {
        input: ["@qwik-city-plan"],
      },
    },

    plugins: [
      ssgAdapter({
        // The production URL where the site will be hosted
        origin: "https://loganpowell.github.io/qwik-lens",  // Replace with your URL
      }),
    ],
  };
});
```

### 2. Resource Paths in Source Code

Create a utility file for base path handling to keep the logic consistent across your app:

#### `src/utils/basePath.ts`

```typescript
/**
 * Base path utilities for GitHub Pages deployment
 */

export const getBase = (): string => {
  return import.meta.env.BASE_URL || "/";
};

export const getBasePath = (): string => {
  const base = getBase();
  return base === "/" ? "" : base.replace(/\/$/, "");
};

export const getResourcePath = (path: string): string => {
  const basePath = getBasePath();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

export const getRoutePath = (route: string): string => {
  const basePath = getBasePath();
  if (route === "/" || route === "") {
    return basePath || "/";
  }
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  return `${basePath}${cleanRoute}`;
};
```

#### `src/root.tsx`

Use the utility functions for resource fetching:

```typescript
import "./global.css";
import { getResourcePath } from "./utils/basePath";

// Resource endpoints for GitHub Pages deployment
const featuresEndpoint = getResourcePath("/features.json");
const manifestEndpoint = getResourcePath("/manifest.json");

export default component$(() => {
  // ... component code
  
  useVisibleTask$(async () => {
    // This will fetch from /qwik-lens/features.json on GitHub Pages
    const response = await fetch(featuresEndpoint);
    // ... rest of fetch logic
  });
});
```

### 3. Navigation Links

Use the `getRoutePath` utility for all navigation links:

#### Any route file (e.g., `src/routes/index.tsx`)

```typescript
import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import { getRoutePath } from "~/utils/basePath";

export default component$(() => {
  return (
    <div>
      {/* Will navigate to /qwik-lens/features on GitHub Pages */}
      <Link href={getRoutePath("/features")}>View All Cards</Link>
      
      {/* Back to home */}
      <Link href={getRoutePath("/")}>Back</Link>
    </div>
  );
});
```

### 4. Build Scripts

Create an automated postdeploy script to copy necessary files:

#### `scripts/postdeploy.js`

```javascript
#!/usr/bin/env node
import { cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const distRoot = join(projectRoot, 'dist');
const publicDir = join(projectRoot, 'public');
const targetDir = join(distRoot, 'qwik-lens');

// Directories to copy
const dirsToCopy = ['build', 'assets'];

function copyRecursive(source, destination) {
  try {
    cpSync(source, destination, { recursive: true, force: true });
    console.log(`✓ Copied: ${source} → ${destination}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${source}:`, error.message);
  }
}

function main() {
  console.log('🚀 Running post-deployment script...\n');

  if (!existsSync(targetDir)) {
    console.error(`✗ Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  // Copy build and assets directories
  console.log('📦 Copying build directories...');
  for (const dir of dirsToCopy) {
    const source = join(distRoot, dir);
    const destination = join(targetDir, dir);
    
    if (existsSync(source)) {
      copyRecursive(source, destination);
    }
  }

  // Copy all files from public directory
  console.log('\n📄 Copying public files...');
  if (existsSync(publicDir)) {
    const publicFiles = readdirSync(publicDir);
    
    for (const file of publicFiles) {
      const sourcePath = join(publicDir, file);
      const stat = statSync(sourcePath);
      
      if (stat.isFile()) {
        const destPath = join(targetDir, file);
        copyRecursive(sourcePath, destPath);
      }
    }
  }

  // Check for generated JSON files at dist root
  console.log('\n📋 Checking for generated files at dist root...');
  if (existsSync(distRoot)) {
    const distFiles = readdirSync(distRoot);
    const jsonFiles = distFiles.filter(f => 
      f.endsWith('.json') && statSync(join(distRoot, f)).isFile()
    );
    
    for (const file of jsonFiles) {
      const sourcePath = join(distRoot, file);
      const destPath = join(targetDir, file);
      
      if (!existsSync(destPath)) {
        copyRecursive(sourcePath, destPath);
      }
    }
  }

  console.log('\n✅ Post-deployment complete!\n');
}

main();
```

#### `package.json`

Update your package.json to use the script:

```json
{
  "scripts": {
    "dev": "vite --mode ssr",
    "build": "qwik build",
    "build.client": "vite build",
    "build.server": "vite build -c adapters/static/vite.config.ts",
    "preview": "npx http-server dist",
    "deploy": "pnpm run build && pnpm run build.server",
    "postdeploy": "node scripts/postdeploy.js",
    "ssg": "pnpm run build.server && pnpm run preview"
  }
}
```

**Why this approach is better:**
- Automatically copies all files from the `public/` directory
- Future-proof: adding new files to `public/` requires no script changes
- Provides clear console output showing what was copied
- Handles errors gracefully
- Checks for generated files at the dist root (like `q-manifest.json`)

### 5. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
    push:
        branches:
            - main
    workflow_dispatch:

permissions:
    contents: read
    pages: write
    id-token: write

concurrency:
    group: "pages"
    cancel-in-progress: false

jobs:
    build_site:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@v5

            - name: Install pnpm
              uses: pnpm/action-setup@v4
              with:
                  version: 10.15.0

            - name: Install Node.js
              uses: actions/setup-node@v5
              with:
                  node-version: 24.7.0
                  cache: "pnpm"

            - run: corepack enable

            - name: Install dependencies
              run: pnpm install --frozen-lockfile

            - name: build
              env:
                  REPO_NAME: ${{ github.event.repository.name }}
              run: |
                  pnpm run deploy

            - name: Upload Artifacts
              uses: actions/upload-pages-artifact@v3
              with:
                  # Upload only the qwik-lens subdirectory, not the entire dist folder
                  path: "dist/qwik-lens"

    deploy:
        needs: build_site
        runs-on: ubuntu-latest

        permissions:
            pages: write
            id-token: write

        environment:
            name: github-pages
            url: ${{ steps.deployment.outputs.page_url }}

        steps:
            - name: Deploy
              id: deployment
              uses: actions/deploy-pages@v4
```

**Key points:**
- `path: "dist/qwik-lens"` - Upload only the final output directory, not the entire `dist/` folder
- `pnpm install --frozen-lockfile` - Ensures reproducible builds
- The `deploy` script runs both client and server builds, then `postdeploy` copies files

### 6. GitHub Repository Settings

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on push to `main`

## Common Issues and Solutions

### Issue 1: Resources Loading from Wrong Path (404 errors)

**Problem:** JavaScript files, JSON files, or other assets return 404.

**Solution:** Ensure `base: "/your-repo-name/"` is set in **both** `vite.config.ts` and `adapters/static/vite.config.ts`.

**Why:** The client build needs the base path to properly embed resource URLs in the generated JavaScript bundles.

### Issue 2: Navigation Links Don't Work

**Problem:** Clicking navigation links goes to `https://username.github.io/features` instead of `https://username.github.io/repo-name/features`.

**Solution:** Prepend the base path to all `<Link href>` values using `import.meta.env.BASE_URL`.

### Issue 3: Features.json or Other Public Resources Return 404

**Problem:** Runtime fetch calls fail with 404.

**Solution:** 
1. Ensure the `postdeploy` script copies the files to `dist/qwik-lens/`
2. Use `import.meta.env.BASE_URL` to construct the fetch URL at build time
3. Verify the base path is set in the main `vite.config.ts` (not just the adapter config)

### Issue 4: Blank Page or JavaScript Errors

**Problem:** The page loads but shows a blank page or console errors about missing modules.

**Solution:** Check that the GitHub Actions workflow uploads the correct directory (`dist/qwik-lens`, not `dist`).

## Testing Locally

To test the GitHub Pages build locally:

```bash
# Build the site
pnpm run deploy

# Serve the qwik-lens subdirectory (simulates GitHub Pages path)
npx http-server dist -p 8080

# Visit: http://127.0.0.1:8080/qwik-lens/
```

## Directory Structure After Build

```
dist/
├── assets/              # Shared assets (copied to qwik-lens/)
├── build/               # JS bundles (copied to qwik-lens/)
├── features.json        # Public data (copied to qwik-lens/)
├── manifest.json        # PWA manifest (copied to qwik-lens/)
├── q-manifest.json      # Qwik manifest
└── qwik-lens/          # FINAL OUTPUT - This is what gets deployed
    ├── assets/         # Copied from dist/assets/
    ├── build/          # Copied from dist/build/
    ├── features/       # Generated by SSG
    │   └── index.html
    ├── features.json   # Copied from dist/
    ├── index.html      # Generated by SSG
    ├── manifest.json   # Copied from dist/
    ├── q-data.json     # Generated by SSG
    └── sitemap.xml     # Generated by SSG
```

## Checklist

Before deploying, ensure:

- [ ] `base` is set in `vite.config.ts`
- [ ] `base` is set in `adapters/static/vite.config.ts`
- [ ] `origin` is set correctly in `ssgAdapter()` config
- [ ] All navigation links use `basePath` prefix
- [ ] All runtime resource fetches use `import.meta.env.BASE_URL`
- [ ] `postdeploy` script copies necessary files
- [ ] GitHub Actions workflow uploads `dist/qwik-lens` (not `dist`)
- [ ] Repository Settings → Pages is set to "GitHub Actions"

## Useful Commands

```bash
# Development
pnpm dev

# Build for production
pnpm run deploy

# Preview locally (simulates GitHub Pages)
npx http-server dist -p 8080
# Then visit: http://127.0.0.1:8080/qwik-lens/

# Check GitHub Actions runs
gh run list --limit 5

# View failed run logs
gh run view <run-id> --log-failed
```

## Additional Resources

- [Qwik Static Site Generation](https://qwik.dev/docs/guides/static-site-generation/)
- [Vite Base Path Configuration](https://vitejs.dev/config/shared-options.html#base)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## Troubleshooting Tips

1. **Always check the browser console** for 404 errors or JavaScript errors
2. **Inspect the network tab** to see which resources are failing to load
3. **Check the generated HTML** in `dist/qwik-lens/index.html` to verify paths are correct
4. **Search the compiled JavaScript** for hardcoded paths: `grep -r "features.json" dist/qwik-lens/build/`
5. **Test locally first** using `http-server` before pushing to GitHub

---

**Last Updated:** December 5, 2025
