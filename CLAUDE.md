# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **marketing, presentation, and download website** for **FinderGit**, a native macOS app that combines file browsing with Git intelligence.

**This is NOT a macOS application.** This is a Next.js web project deployed on Vercel.

- **Live URL**: https://findergit-website.vercel.app/
- **App repository** (private, Swift/SwiftUI): https://github.com/gfazioli/FinderGit
- **Website repository** (this): https://github.com/gfazioli/findergit-website

The website serves as:
1. **Landing page** — hero section, feature showcase, download CTA
2. **Documentation** — user guides, keyboard shortcuts, getting started
3. **Release notes** — pulled automatically from GitHub Releases API
4. **Download hub** — links to GitHub Releases for the macOS binary

## Tech Stack

- **Framework**: Next.js 16 + Nextra 4 (docs/MDX)
- **UI Library**: Mantine 9
- **Animations**: @gfazioli/mantine-scene, @gfazioli/mantine-text-animate, @gfazioli/mantine-marquee
- **Icons**: @tabler/icons-react
- **Analytics**: @vercel/analytics
- **Hosting**: Vercel
- **Package Manager**: Yarn 4 (Berry) — do not use npm or pnpm

## Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start Next.js dev server |
| `yarn build` | Production build (Next.js + pagefind search index) |
| `yarn test` | Full suite: typegen, oxfmt, lint, typecheck, jest |
| `yarn jest` | Run Jest tests only |
| `yarn typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `yarn lint` | oxlint + Stylelint |
| `yarn format:write` | Auto-format all TS/TSX/CSS files (oxfmt) |
| `yarn storybook` | Storybook dev server on port 6006 |
| `yarn analyze` | Bundle analysis with `@next/bundle-analyzer` |

> **If `yarn <cmd>` fails with `command not found: oxfmt` / `next`** the Yarn PATH shim isn't wired on this machine — run the binary directly instead: `./node_modules/.bin/oxfmt`, `./node_modules/.bin/next dev`, `./node_modules/.bin/next build`. `yarn test` / `yarn jest` route through the npm-run shim and work regardless.

## Architecture

### Routing & Content

- **App Router** (`app/`): Next.js 16 app router with Nextra integration
- **Docs content** (`content/`): MDX files rendered via Nextra at `/docs/[[...mdxPath]]`
- Nextra is configured with `contentDirBasePath: '/docs'` — all MDX content is served under `/docs`
- `content/_meta.ts` controls sidebar navigation order and labels

### Layout & Theme Integration

- `app/layout.tsx` wraps the entire app in both `MantineProvider` and Nextra's `Layout`
- The site is dark only, with no switch: see **At night** below
- Mantine theme overrides go in `theme.ts` (client-side `createTheme`)
- Global site configuration (metadata, GitHub API, search, Nextra layout) lives in `config/index.ts`
- Primary color: `findergit`, the Finder face's blues from the app icon (`theme.ts`)

### At night

One dark scheme, forced, since 2026-09-23 (the user asked for netfox.app's treatment). The traps below were each measured, on this site or on netfox.app, which went through the same change first.

- **Both libraries are forced dark.** `ColorSchemeScript` and `MantineProvider` take `forceColorScheme="dark"`, so a visitor who picked light with the old switch is not left on a scheme nothing is written for; Nextra's `Layout` takes `darkMode={false}` and `nextThemes={{ defaultTheme: 'dark', forcedTheme: 'dark' }}`. Mantine's OWN dark scheme, tinted, rather than netfox.app's night written over the light scheme: this site was already drawn for dark. `html { color-scheme: dark }` sends every leftover `light-dark()` to its dark branch.
- **The palette is the icon's, sampled by k-means** (the git nodes by hand; they are too small to cluster), and it lives as `--fg-*` tokens on `:root` in `theme/global.css`, with the surfaces (`--fg-page`, `--fg-top`, `--fg-lift`, `--fg-rule`, `--fg-glass`, `--fg-footer`). **On `:root`, not on the body**: a `var()` inside a custom property resolves where it is DECLARED, so a token Nextra reads from `html` would keep the root's value whatever the body said.
- **Overriding a Mantine variable needs `html:root[data-mantine-color-scheme='dark']`**: the provider injects its variables later under the same selector, and an equal-specificity override silently loses.
- **`primaryShade: 6` in both schemes.** Mantine's dark default is 8, which here is the icon's outline navy: every filled button came out a dull denim.
- **Nextra's primary colour is set on its `Head`** (`color`, `backgroundColor` in `app/layout.tsx`), not class by class: its links, active row and table of contents are all cut from it. The active sidebar row still takes `findergit-6`, because white on the primary itself is 2.9:1.
- **The home page's ground is one body gradient** (`body:has(.fg-home)`), reaching `--fg-page` at 2800px and holding it. Section washes are fixed `radial-gradient`s, painted once: no `<Scene>`, no dot grid, no animated layer (user: the dots read as netfox.app's, and atmosphere must cost no CPU). A wash that has to dissolve into the page at its edges takes `.fg-feather`; the hero does NOT, because the body gradient has not reached `--fg-page` at its bottom edge and a feather there drew a dark rule across the page.
- **Measure contrast in place**, against the real ground: a DOM walk in a real browser (`lancetta-website/scripts/shot.mjs --eval`). Its colour parser reads `rgb()` only; a `lab()` colour (Nextra's text) comes out as a false 1.5:1 and has to be checked by eye.

### Key Components (`components/`)

- `MantineNavBar` — top navigation with FinderGit logo + GitHub link
- `MantineFooter` — 4-column footer with highlights, resources, ecosystem links
- `Welcome` — hero section with animated title, features grid, download CTA
- `ReleaseNotes` — fetches GitHub releases via `/api/github-releases`

### API Routes (`app/api/`)

- `version/` — returns current package version
- `github-releases/` — proxies GitHub Releases API for FinderGit (configured in `config/index.ts`). Uses `GITHUB_TOKEN` env var when set to raise the rate limit from 60/hr to 5000/hr.
- `search/` — pagefind-based full-text search endpoint

### Environment variables

- `GITHUB_TOKEN` (optional, recommended on Vercel) — fine-grained or classic token with `public_repo` read scope. Used by:
  - The `/api/github-releases` proxy (runtime).
  - The `content/release-notes.mdx` TOC metadata, which fetches at build time so Vercel needs the var available during deploys.
  Without the token the app still works but may hit 60 req/hr GitHub rate limit on shared IPs.

### CSS Import Order

In `app/layout.tsx`, CSS imports must follow this order:
1. `@mantine/core/styles.css`
2. Mantine extension styles (marquee, text-animate, scene)
3. Global styles

## Content Guidelines

- All website content is in **English**
- The app is described as: "A Git-aware file browser for macOS"
- Key selling points: sortable columns, live git status, inline diff viewer, git actions, search & filter, native macOS app
- Target audience: developers who use Git and want a better file browsing experience on macOS
- Download links point to GitHub Releases on the **website** repo (the FinderGit app repo is private, so releases are published here): `https://github.com/gfazioli/findergit-website/releases/latest` — matches `config.app.downloadUrl`.

### No infrastructure leaks in user-facing copy

User-facing pages (`content/*.mdx` aimed at end users, the homepage, release notes hosted at `public/release-notes/<version>.html`, FAQ entries, marketing CTAs) **never name the underlying provider, model, or infrastructure**:

- ❌ "Groq", "Llama", "OpenAI", "Anthropic" — say "the AI" or "the AI provider"
- ❌ "Vercel proxy", "Next.js API route", "Cloudflare Worker" — say "FinderGit handles the request on your behalf"
- ❌ "Sparkle", "AppKit's NSEvent monitor", framework names — say "the auto-update framework" / "macOS keyboard handling"
- ✅ User-relevant facts ARE allowed: "free", "no API key required", "diffs are not stored", "macOS 15+ required", "100 KB diff cap"

Reasoning: end users care about what the feature does for them, not which vendor or library powers it. Naming the stack also paints us into a corner if we ever swap it (e.g., a different AI provider) — would force rewriting every page.

**Exceptions**:
- Developer-facing files (commit messages, this `CLAUDE.md`, `CHANGELOG.md`) — name infra freely
- "Under the hood" sections at the bottom of release notes — okay to be specific for power users who want to know, but prefer generic phrasing where it doesn't lose information
- The bring-your-own-key provider docs (`content/ai-commit-messages.mdx` → *Bring your own key*, `content/settings.mdx` → *AI → Provider*) — name Anthropic, OpenAI, Ollama and LM Studio freely. There the names are the product's own UI: *Anthropic* and *OpenAI-compatible* are the labels of the app's provider picker (`FinderGitCore/AICommitProvider.swift`), and the reader has to recognise which service to point FinderGit at. The rule still holds for the default mode — never name the provider behind *FinderGit (no key needed)*

## Tooling

- **Formatter**: oxfmt (`.oxfmtrc.json`)
- **Linter**: oxlint + stylelint
- **TypeScript**: 6.x
- **Package Manager**: Yarn 4 (Berry). Do not use npm or pnpm.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
