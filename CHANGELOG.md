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

## CI/CD Build Workflow - 2025-12-30

### Added GitHub Actions Build and Lint Workflow

**Files created:**

1. `.github/workflows/build.yml` - CI workflow for code quality checks
   - Runs on push to main and pull requests
   - Checks code formatting with Prettier
   - Runs ESLint for code quality
   - Builds the project to ensure no build errors

**Workflow steps:**

1. Checkout code
2. Setup Node.js 20
3. Install dependencies with `npm ci`
4. Check formatting: `npx prettier --check .`
5. Lint code: `npm run lint`
6. Build project: `npm run build`

## Playwright E2E Testing - 2025-12-30

### Added Playwright for End-to-End Testing

**Commands executed:**

```bash
# Install Playwright
npm install -D @playwright/test

# Install Chromium browser
npx playwright install chromium
```

**Files created:**

1. `playwright.config.ts` - Playwright configuration:
   - Test directory: `./e2e`
   - Base URL: `http://localhost:5173/simple-app/`
   - Web server configured to run dev server
   - Chromium browser only

2. `e2e/counter.spec.ts` - Counter test:
   - Navigates to app
   - Asserts counter button shows "count is 0"

**Configuration changes:**

1. Updated `src/App.tsx` - added `data-testid="counter-button"` to counter button
2. Updated `package.json` - added test scripts:
   - `test:e2e` - Run tests in headed mode (browser visible)
   - `ci:test:e2e` - Run tests in headless mode for CI
3. Updated `.github/workflows/build.yml` - added Playwright browser install and e2e test steps

**Usage:**

```bash
npm run test:e2e       # Run e2e tests in headed mode (browser visible)
npm run ci:test:e2e    # Run e2e tests in headless mode (for CI)
```

**Stack additions:**

- @playwright/test 1.57.0

## Quality & Reliability Features - 2025-12-30

### Added Comprehensive Quality Tooling

**1. Unit Testing with Vitest**

Commands executed:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Files created:

- `vite.config.ts` - Added Vitest configuration (jsdom environment, coverage, setupFiles)
- `src/test/setup.ts` - Test setup with jest-dom matchers
- `src/App.test.tsx` - Unit tests for App component

Scripts added:

- `test` - Run tests in watch mode
- `test:run` - Run tests once
- `test:coverage` - Run tests with coverage report

**2. Pre-commit Hooks with Husky + lint-staged**

Commands executed:

```bash
npm install -D husky lint-staged
npx husky init
```

Files created:

- `.husky/pre-commit` - Pre-commit hook that runs lint-staged
- `.lintstagedrc.json` - Lint-staged configuration:
  - Runs Prettier on all staged files
  - Runs ESLint fix on TypeScript files
  - Runs type checking with tsc

**3. Dependency Management with Dependabot**

Files created:

- `.github/dependabot.yml` - Automated dependency updates:
  - Weekly npm dependency updates (Mondays)
  - Weekly GitHub Actions updates
  - Auto-prefixed commit messages

**4. Security Scanning in CI**

Configuration changes:

- Updated `.github/workflows/build.yml`:
  - Added `npm audit --audit-level=high` after install
  - Added unit test step after lint
  - Pipeline now: install → audit → format → lint → unit test → build → e2e test

**Usage:**

```bash
# Unit tests
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage

# Pre-commit hooks run automatically on git commit
```

**Stack additions:**

- vitest 4.0.16
- @testing-library/react 16.3.1
- @testing-library/jest-dom 6.9.1
- @testing-library/user-event 14.6.1
- jsdom 27.4.0
- husky 9.1.7
- lint-staged 16.2.7
