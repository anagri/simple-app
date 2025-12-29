# Changelog

## Initial Setup - 2025-12-30

### Bootstrap React + Vite + TailwindCSS + TypeScript App

**Commands executed:**

```bash
# Create Vite React TypeScript app in current directory
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install Tailwind CSS v4
npm install -D tailwindcss @tailwindcss/vite
```

**Manual configuration:**

1. Updated `vite.config.ts` - added TailwindCSS plugin:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

2. Updated `src/index.css` - replaced content with Tailwind import:

```css
@import 'tailwindcss';
```

**Final stack:**

- React 19.2.0
- Vite 7.2.4
- TailwindCSS 4.1.18
- TypeScript 5.9.3

**Run dev server:**

```bash
npm run dev
```

## GitHub Pages Deployment - 2025-12-30

### Added GitHub Actions Workflow for Automated Deployment

**Files created:**

1. `.github/workflows/deploy.yml` - GitHub Actions workflow for deploying to GitHub Pages
   - Triggers on push to main branch
   - Builds the app using `npm ci` and `npm run build`
   - Deploys to GitHub Pages using official actions

**Configuration changes:**

1. Updated `vite.config.ts` - added base path for GitHub Pages:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/simple-app/',
});
```

**Setup required in GitHub repo:**

- Go to Settings → Pages
- Under "Build and deployment", select "GitHub Actions" as the source
- Ensure "Read and write permissions" are enabled in Settings → Actions → General

**Deployment:**

- Automatic on every push to main branch
- App will be available at: https://bodhisearch.github.io/simple-app/

## ESLint + Prettier Integration - 2025-12-30

### Added Prettier and ESLint Integration for Code Quality

**Commands executed:**

```bash
# Install Prettier and ESLint-Prettier integration
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Files created:**

1. `.prettierrc` - Prettier configuration:

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

2. `.prettierignore` - Files/directories to ignore during formatting

**Configuration changes:**

1. Updated `eslint.config.js` - added Prettier plugin and config
2. Updated `package.json` - added `lint:fix` script that formats and fixes linting issues

**Usage:**

```bash
npm run lint        # Check for linting issues
npm run lint:fix    # Format with Prettier and auto-fix linting issues
```

**Stack additions:**

- Prettier 3.7.4
- eslint-config-prettier 10.1.8
- eslint-plugin-prettier 5.5.4
