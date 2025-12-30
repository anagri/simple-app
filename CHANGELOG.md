# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Updated GitHub Actions to latest versions:
  - `actions/checkout@v6` (Node.js 24 support)
  - `actions/setup-node@v6` (automatic npm caching)
  - `actions/upload-pages-artifact@v4`
- Updated `@types/node` to v25.0.3

## 2025-12-30

### Added - OAuth 2.1 Authentication

**Commit:** Add OAuth 2.1 authentication with Keycloak (27d9952)

Implemented custom OAuth 2.1 authentication library with PKCE flow for Keycloak public client as **non-UI SDK**:

- Custom auth library in `src/auth/` (6 files) - non-UI focused with **single hook**
  - **Provider module**: `AuthProvider.tsx` (context, useAuth hook, integrated callback processing)
  - **Core modules**: `oauth.ts` (PKCE flow, token exchange, revocation), `storage.ts` (localStorage), `types.ts`, `constants.ts`, `index.ts`
  - Single `useAuth()` hook returns auth state, actions, and callback state
  - AuthProvider auto-detects callback route (URL `code` param) and processes internally
  - OAuth callback with React StrictMode safety (prevents duplicate token exchanges)
  - Namespaced localStorage for token management
  - Token auto-refresh with 60s buffer before expiry
  - Token revocation via API (no Keycloak logout redirect)
- Configuration via environment variables (`.env.example`, `src/config.ts`)
- Host app integration in `src/App.tsx` using single hook with custom UI (`CallbackPage` component)
- Integration with React app (`src/main.tsx`)
- TypeScript environment definitions (`src/vite-env.d.ts`)

**Exported API:**

- Component: `AuthProvider` (context provider wrapper)
- Hook: `useAuth()` → `{ isAuthenticated, isLoading, user, error, signIn, signOut, getAccessToken, refreshAccessToken, isProcessingCallback, callbackError, callbackReturnUrl }`
- Types: `AuthConfig`, `AuthUser`, `AuthState`, `AuthError`, `AuthErrorCode`, `AuthContextValue`, `SignInOptions`

**Stack additions:**

- Custom OAuth 2.1 + PKCE implementation

### Added - E2E and Unit Tests for OAuth

**Commit:** Add E2E and unit tests for OAuth authentication (112b722)

Comprehensive testing for OAuth authentication flow:

- **E2E Tests:**
  - Page Object Model implementation (`e2e/pages/auth-section.ts`)
  - Test credentials management (`e2e/test-credentials.ts`, `e2e/.env.test.example`)
  - Complete OAuth flow test with real Keycloak server (`e2e/login.spec.ts`)
  - Playwright config with dotenv integration (`playwright.config.ts`)
- **Unit Tests:**
  - Enhanced App component tests with OAuth redirect testing (`src/App.test.tsx`)
  - Test utilities for auth mocking (`src/test/auth-utils.tsx`)

**Stack additions:**

- dotenv 17.2.3 (for E2E test credentials)

### Changed - CI/CD Workflows

**Commit:** Update CI/CD workflows for auth environment variables (797d567)

Added authentication support to CI/CD:

- Added auth environment variables to build step (`VITE_AUTH_URL`, `VITE_CLIENT_ID`, etc.)
- Added test credentials to E2E test step (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`)
- Enabled workflows on all branches (removed branch restrictions)

**Commit:** Merge build and deploy workflows with fixes (c2261af)

Unified build and deployment into single workflow:

- Merged `deploy.yml` into `build.yml` for streamlined pipeline
- Deploy job runs only on main branch after successful build
- Fixed test script name (`test:run` → `test`)
- Added permissions and concurrency configuration for GitHub Pages
- Complete pipeline: audit → format → lint → test → build → e2e → deploy

### Added - GitHub Pages SPA Routing

**Commit:** Add GitHub Pages SPA routing fix (98cd18c)

Implemented 404 redirect hack for client-side routing on GitHub Pages:

- `public/404.html` - Redirect script converts 404 paths to query strings
- `index.html` - Restoration script decodes path before app loads
- Enables OAuth callback route (`/callback`) to work without server-side routing
- Based on [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages)

**Example:** `/simple-app/callback` → 404 → `/?/callback` → `/callback` (restored)

### Added - Login Screen UI

**Commit:** Replace placeholder page with Login screen (ef64b7e)

Replaced Vite default page with OAuth login interface:

- Clean login screen with welcome message
- Login button with `data-testid` for testing
- Authenticated state display with user info and logout button
- Responsive layout using Tailwind CSS

### Added - Quality & Reliability Features

**Commit:** Add quality and reliability features (e7a0e3d)

Comprehensive quality tooling setup:

1. **Unit Testing with Vitest:**
   - Vitest configuration in `vite.config.ts` (jsdom environment, coverage)
   - Test setup file (`src/test/setup.ts`)
   - App component tests (`src/App.test.tsx`)
   - Scripts: `test`, `test:coverage`

2. **Pre-commit Hooks:**
   - Husky + lint-staged integration
   - Automatic formatting with Prettier
   - ESLint fixes on TypeScript files
   - Type checking with `tsc --noEmit`
   - Configuration: `.husky/pre-commit`, `.lintstagedrc.json`

3. **Dependency Management:**
   - Dependabot configuration (`.github/dependabot.yml`)
   - Weekly npm dependency updates (Mondays)
   - Weekly GitHub Actions updates
   - Auto-prefixed commit messages (`chore(deps):`, `chore(ci):`)

4. **Security Scanning:**
   - Added `npm audit --audit-level=high` to CI pipeline

**Stack additions:**

- vitest 4.0.16
- @testing-library/react 16.3.1
- @testing-library/jest-dom 6.9.1
- @testing-library/user-event 14.6.1
- jsdom 27.4.0
- husky 9.1.7
- lint-staged 16.2.7

### Added - Playwright E2E Testing

**Commit:** Add Playwright e2e testing (76e1725)

End-to-end testing setup:

- Playwright configuration (`playwright.config.ts`)
  - Test directory: `./e2e`
  - Base URL: `http://localhost:5173/simple-app/`
  - Chromium browser only
  - Web server auto-start
- Example counter test (`e2e/counter.spec.ts`)
- Added `data-testid` attributes to App component
- CI integration in `build.yml` workflow
- Scripts: `test:e2e` (headed), `ci:test:e2e` (headless)

**Stack additions:**

- @playwright/test 1.57.0

### Added - Repository Guidance

**Commit:** Add CLAUDE.md for repository guidance (9e4cb1e)

Created `CLAUDE.md` documentation for Claude Code:

- Technology stack overview
- Development commands
- Project configuration details
- Testing guidelines
- CI/CD workflow information
- GitHub Pages setup instructions
- Development workflow best practices

### Added - CI/CD Build Workflow

**Commit:** Add CI/CD build workflow (8dd164f)

Created GitHub Actions workflow for continuous integration:

- Workflow file: `.github/workflows/build.yml`
- Runs on: push to main, pull requests
- Pipeline: checkout → setup → install → format check → lint → build
- Ensures code quality before deployment

### Added - Code Quality Tools

**Commit:** Add ESLint + Prettier integration and format codebase (7415cad)

Integrated Prettier with ESLint for consistent code style:

- Prettier configuration (`.prettierrc`, `.prettierignore`)
- ESLint + Prettier integration (`eslint-config-prettier`, `eslint-plugin-prettier`)
- Updated `eslint.config.js` with Prettier plugin
- Added `lint:fix` script for formatting and auto-fixing
- Formatted entire codebase

**Configuration:**

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Stack additions:**

- prettier 3.7.4
- eslint-config-prettier 10.1.8
- eslint-plugin-prettier 5.5.4

### Added - GitHub Pages Deployment

**Commit:** Add GitHub Pages deployment workflow (944cecc)

Automated deployment to GitHub Pages:

- Workflow file: `.github/workflows/deploy.yml`
- Triggers on push to main branch
- Pipeline: checkout → setup → install → build → deploy
- Updated `vite.config.ts` with `base: '/simple-app/'`
- Deployed at: https://bodhisearch.github.io/simple-app/

**Required repo settings:**

- Settings → Pages → Source: "GitHub Actions"
- Settings → Actions → General → "Read and write permissions"

### Added - Documentation

**Commit:** Add CHANGELOG.md documenting setup steps (6f34aa2)

Initial changelog documenting:

- Bootstrap setup steps
- GitHub Pages configuration
- ESLint + Prettier integration
- CI/CD workflows

### Added - TailwindCSS Configuration

**Commit:** configured tailwindcss (107b9d6)

TailwindCSS v4 setup:

- Updated `vite.config.ts` with TailwindCSS Vite plugin
- Updated `src/index.css` with `@import 'tailwindcss';`
- No PostCSS config required (Vite plugin handles it)

**Stack additions:**

- @tailwindcss/vite 4.1.18
- tailwindcss 4.1.18

### Added - Initial Project Setup

**Commit:** npm create vite@latest . -- --template react-ts (71acb51)

Bootstrapped React + TypeScript project using Vite:

- React 19.2.0
- Vite 7.2.4
- TypeScript 5.9.3
- ESLint 9.39.1

**Commands:**

```bash
npm create vite@latest . -- --template react-ts
npm install
```
