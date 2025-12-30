# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Technology Stack

- **React 19.2.0** with TypeScript
- **Vite 7.2.4** - Build tool with HMR
- **TailwindCSS 4.1.18** - Utility-first CSS framework
- **ESLint + Prettier** - Code quality and formatting

## Development Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:5173

# Testing
npm test                 # Run unit tests once
npm run test:coverage    # Run unit tests with coverage report
npm run test:e2e         # Run e2e tests (headed mode, browser visible)
npm run ci:test:e2e      # Run e2e tests (headless, for CI)

# Code Quality
npm run lint             # Check for linting issues
npm run lint:fix         # Format with Prettier and auto-fix ESLint issues

# Build
npm run build            # TypeScript check + Vite build (outputs to dist/)
npm run preview          # Preview production build locally
```

## Project Configuration

### Vite Base Path

The app is configured with `base: '/simple-app/'` in `vite.config.ts` for GitHub Pages deployment. This affects asset paths in production.

### TailwindCSS v4

This project uses TailwindCSS v4 (not v3). Key differences:

- Import via `@import 'tailwindcss';` in CSS (not separate directives)
- Configured via Vite plugin in `vite.config.ts` (not `tailwind.config.js`)
- No PostCSS config required

### ESLint Configuration

Uses ESLint flat config format (`eslint.config.js`). Prettier is integrated as an ESLint rule, so `npm run lint:fix` handles both formatting and linting.

## Testing

### Unit Tests (Vitest)

- Tests located in `src/**/*.test.tsx`
- Uses @testing-library/react for component testing
- Coverage reports generated in `coverage/` directory
- Configured in `vite.config.ts` with jsdom environment

### E2E Tests (Playwright)

- Tests located in `e2e/**/*.spec.ts`
- Configured in `playwright.config.ts`
- Run in headed mode locally, headless in CI

### Pre-commit Hooks

Pre-commit hooks automatically run on `git commit`:

- Format all files with Prettier
- Lint and fix TypeScript files with ESLint
- Type-check with TypeScript compiler

Configured via Husky + lint-staged (`.husky/pre-commit` and `.lintstagedrc.json`)

## UI Development Guidelines

### General Requirements

- **Responsive Design**: Adaptive desktop/mobile layouts using Tailwind CSS breakpoints (sm, md, lg, xl)
- **Mobile Support**: Not necessarily fully functional on mobile, but must support proper layout at different viewport widths/heights
- **Clean UI**: Follow modern UI/UX best practices with proper spacing, typography, and visual hierarchy
- **Testing Attributes**: All interactive elements must have `data-testid` attributes for automated testing
  - Use `data-testid` for primary element identification (e.g., `data-testid="login-button"`)
  - Use additional `data-test-*` attributes for state or context when needed
  - Enables testing with both Playwright (e2e) and React Testing Library (unit)
- **Accessibility**: Use semantic HTML and ARIA attributes where appropriate

### Styling Conventions

- Use TailwindCSS utility classes for all styling
- Follow mobile-first responsive design (base styles for mobile, breakpoints for larger screens)
- Consistent color scheme using Tailwind's color palette
- Proper focus states and keyboard navigation support

## Authentication

This app uses **OAuth 2.1 with PKCE** for authentication via Keycloak public client.

### Configuration

Authentication is configured via environment variables in `.env`:

```bash
VITE_AUTH_URL=https://main-id.getbodhi.app/realms/bodhi
VITE_CLIENT_ID=your-client-id
VITE_APP_URL=http://localhost:5173  # Optional, defaults to window.location.origin
VITE_BASE_PATH=/simple-app
```

### E2E Test Credentials

E2E tests require test user credentials in `e2e/.env.test`:

```bash
TEST_USER_EMAIL=user@email.com
TEST_USER_PASSWORD=your-password
```

This file is gitignored. Use `e2e/.env.test.example` as template.

### Implementation Details

- Custom auth library in `src/auth/` (6 files) - **non-UI SDK** with PKCE flow
  - **Provider module**: `AuthProvider.tsx` (context, useAuth hook, integrated callback processing)
  - **Core modules**: `oauth.ts` (PKCE flow, token exchange), `storage.ts` (localStorage), `types.ts`, `constants.ts`, `index.ts`
- **Single hook** `useAuth()` returns auth state, actions, and callback state
- AuthProvider auto-detects callback route (URL `code` param) and processes internally
- Host app provides all UI rendering via components using the single hook
- OAuth callback with React StrictMode safety (prevents duplicate token exchanges)
- Namespaced localStorage for token management
- Token auto-refresh with configurable buffer (60s before expiry)
- Token revocation via API (no Keycloak logout redirect)
- Page Object Model for E2E testing (`e2e/pages/auth-section.ts`)

**Exported API:**

- Component: `AuthProvider` (context provider wrapper)
- Hook: `useAuth()` → `{ isAuthenticated, isLoading, user, error, signIn, signOut, getAccessToken, refreshAccessToken, isProcessingCallback, callbackError, callbackReturnUrl }`
- Types: `AuthConfig`, `AuthUser`, `AuthState`, `AuthError`, `AuthErrorCode`, `AuthContextValue`, `SignInOptions`

**Usage Pattern:**

```tsx
// Single hook for everything - main page
function MainPage() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();
  // ... render UI
}

// Same hook on callback page
function CallbackPage() {
  const { isProcessingCallback, callbackError, callbackReturnUrl } = useAuth();

  useEffect(() => {
    if (callbackReturnUrl) {
      window.location.href = callbackReturnUrl;
    }
  }, [callbackReturnUrl]);

  if (isProcessingCallback) return <MySpinner />;
  if (callbackError) return <MyError error={callbackError} />;
  return null;
}
```

## GitHub Pages SPA Routing

Client-side routing handled via 404 redirect hack:

- `public/404.html` - Redirects 404s by encoding path to query string
- `index.html` - Restoration script decodes path before app loads
- Enables OAuth callback route (`/callback`) to work on GitHub Pages
- Based on [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages)

## CI/CD

Single unified GitHub Actions workflow:

- **build.yml** - Runs on all pushes/PRs: security audit, format check, lint, unit tests, build, e2e tests
- **deploy** - GitHub Pages deployment runs only on main branch after successful build

### Dependabot

Automated dependency updates configured (`.github/dependabot.yml`):

- Weekly npm dependency PRs (Mondays)
- Weekly GitHub Actions updates
- Commit messages prefixed with `chore(deps):` or `chore(ci):`

## GitHub Pages Setup

Deployed at: https://bodhisearch.github.io/simple-app/

Required repo settings:

- Settings → Pages → Source: "GitHub Actions"
- Settings → Actions → General → "Read and write permissions"

## Development Workflow

### Documentation

Update `CHANGELOG.md` for all major changes:

- New features or functionality
- Dependencies added/updated
- Configuration changes
- CI/CD workflow modifications
- Build process changes

Follow existing CHANGELOG format with date, section headings, and details.

### CI/CD Considerations

When making changes, review if CI/CD workflows need updates:

- New dependencies → verify they install correctly in workflows
- New build steps → add to `build.yml` workflow
- New linting rules → ensure they run in CI
- Environment variables → add to workflow secrets/vars if needed
- New scripts in package.json → consider adding to CI pipeline
