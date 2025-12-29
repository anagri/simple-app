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

## CI/CD

Two GitHub Actions workflows:

- **build.yml** - Runs on push/PR: format check, lint, build
- **deploy.yml** - Deploys to GitHub Pages on push to main

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
