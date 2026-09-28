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
- **Animations**: @gfazioli/mantine-text-animate, @gfazioli/mantine-marquee, and the site's own scroll reveals and mascot (`components/Motion`, `components/Mascot`; see **Motion** below)
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
- **Measure contrast in place**, against the real ground: a DOM walk in a real browser (`scripts/shot.mjs --eval`). Its colour parser reads `rgb()` only; a `lab()` colour (Nextra's text) comes out as a false 1.5:1 and has to be checked by eye.

### Key Components (`components/`)

- `MantineNavBar` — top navigation with FinderGit logo + GitHub link
- `MantineFooter` — 4-column footer with highlights, resources, ecosystem links
- `Welcome` — hero section with animated title, features grid, download CTA
- `Motion` — scroll reveals, rolling figures and the rim light; `Mascot` — the pixel character that narrates the hero carousel (both under **Motion** below)
- `ReleaseNotes` — renders the releases `content/release-notes.mdx` fetched and compiled at BUILD time (`load-releases.ts`); only when the build got none does it fall back to fetching `/api/github-releases` in the browser

### API Routes (`app/api/`)

- `version/` — returns current package version
- `github-releases/` — proxies GitHub Releases API for FinderGit (configured in `config/index.ts`). Uses `GITHUB_TOKEN` env var when set to raise the rate limit from 60/hr to 5000/hr.
- `search/` — pagefind-based full-text search endpoint

### Environment variables

- `GITHUB_TOKEN` (optional, recommended on Vercel) — fine-grained or classic token with `public_repo` read scope. Used by:
  - The `/api/github-releases` proxy (runtime, now only the fallback).
  - `content/release-notes.mdx`, which fetches the releases at build time for both the page and its TOC, so Vercel needs the var available during deploys.
  Without the token the app still works but may hit 60 req/hr GitHub rate limit on shared IPs.

### CSS Import Order

In `app/layout.tsx`, CSS imports must follow this order:
1. `@mantine/core/styles.css`
2. Mantine extension styles (marquee, text-animate, scene)
3. Global styles

### What a crawler gets is the served HTML

Measured 2026-09-24, when Search Console listed pages as *Crawled - currently not indexed*: two pages reached Google nearly empty, and neither looked wrong in a browser.

- **`/docs/release-notes` was 32 words.** The releases were fetched in the browser from `/api/github-releases`, and that route answers **403 to any user agent containing `bot`** -- Googlebot's rendering service included. The hook never checked the status, so the 403 body threw inside it and even the JavaScript-rendered page stayed on the *Loading releases...* skeleton. Now `load-releases.ts` fetches and compiles them at build time (release.sh publishes the GitHub release BEFORE pushing the website commit, so the deploy after a release sees it) and the page carries about 2,400 words; the browser makes no request at all. Bodies compile as `md`, one `try` each: a body is written on GitHub after the build, and a brace in MDX is a JavaScript expression.
- **`/docs/faq` was 129 words: the questions, no answers.** Mantine 9's Accordion keeps a closed panel in a React `<Activity>`, which renders nothing on the server. `keepMountedMode="display-none"` renders every answer and only hides it. The JSON-LD mirror had the answers all along; the visible markup did not. The test for it uses `renderToString`, because a jsdom `render` mounts a hidden Activity's children and cannot see the defect.

Check a page the way a crawler gets it: `curl -A Googlebot` and count words in `<main>` with the scripts stripped. A number under a few hundred on a page that looks full in the browser is this class of defect.

## Motion: the page reveals itself, and a mascot narrates the carousel

Asked for on 2026-09-28, *"come fatto su lancetta website vorrei che progettassi un logo/pupazzetto da animare sul sito web per findergit e aggiungessi anche le animazioni e morph sul sito web"*. `components/Motion` is lancetta.app's #59, cross-ported; `components/Mascot` is this site's counterpart of lancetta.app's `PanelHint`.

**Reveals** (`Reveal`, `revealScope` / `revealItem`, `useReveal`): one IntersectionObserver per scope, one-shot. Every section heading rises. Cards MORPH, squashed and low then the landing spring, with the light running round their rim at the top right (the icon's sky) and bottom left (its lilac): the problem cards, the feature cards, the Finder and FinderGit windows, the diff, the Kaleidoscope comparison and the AI commit panel. Badges and pills pop; each In action screenshot comes in from the side it sits on (`left` / `right`) and its copy rises. Inside the Solution window the Git state arrives AFTER the window lands, row by row (`rowDelay`): the Problem section's plain Finder list turning into FinderGit, which is the one morph on the page that says what the product does. The diff's lines rise top to bottom; the AI message rises line by line after the AI button pops.

**Figures roll** (`ScrollNumber`): the release count in the hero (only when the page mounts with the strip below the fold), the Solution window's stars, sizes, sidebar counts and totals, the diff's `+8 -2`, and the "100" in *100% native*. The element's text is only ever the value; the rolling digits are generated content.

**Nothing is hidden until a script has found it off screen.** Three states per scope: REST is the served HTML, ARMED (`data-armed`) is set after mount only on what is entirely off screen, REVEALED on the way into view. Only a revealed item has a transition, so arming snaps. `threshold` is 0. Verified 2026-09-28 on `next start`: the served HTML carries 0 `data-armed` and 90 `data-reveal`; all 13 hiding selectors in the served CSS name `data-armed`; at 1440x900 the page mounts with 65 armed, and after a scroll through the whole page none is left armed or off its pose and no digit is off its value. At 390 17 stay armed for good: they are the Solution window's figures in columns a phone does not display (`visibleFrom="sm"`), so they are never seen, and they roll if the window is widened to show them.

`<html>` carries **`data-scroll-behavior="smooth"`**: app/global.css scrolls `html` smoothly and Next 16 keeps that across a route change without it. Measured from `/docs/faq` at 900 with a click on the logo: the home mounts at 0, 65 armed, nothing revealed out of sight.

Mechanics that cost a round:

- **A card that lifts on hover is wrapped, never given the props**: two transforms on one element fight. The wrapper is then the grid cell, so it carries a leftover card's `gridColumn` span, and the card takes `h="100%"` to keep a row level.
- **A centred flex item shrinks to its content**, so a paragraph with a `maw` inside a wrapper sits at the wrapper's left. Put the measure on the wrapper (the Problem caption).
- **The In action section clips `overflow-x`**: a screenshot 80px out would widen the page for the length of the spring. Sampled mid-slide at 1440: `scrollWidth` stayed 1440.
- **The springs are generated** (`components/Motion/springs.ts`) into the palette's own `:root` block in `theme/global.css`, between `springs:begin` / `springs:end`; `springs.test.ts` fails when they disagree (mutated by hand to prove it). A second `:root` is refused by stylelint as a duplicate selector. Sampled on a landing card at 1440: scaleY 0.70, peak 1.049 at about 500 ms, 0.992, settled by about 1.3 s — the film's 16% overshoot.
- **An armed figure reads zeros once it scrolls in, until its `delay` runs out**: the hold is what makes the roll seen. The Solution window's totals start with the second row (`TALLY_DELAY`, 560 ms); at `rowDelay(5)`, 1000 ms, "000 MB" sat there for about 1.1 s (measured in review).

**The mascot** (`components/Mascot`). The app icon's face come alive: its two halves, the nose, the navy eyes and smile; arms that are the icon's git lines with a commit node for a hand; sky legs. The grids in `sprite.ts` ARE the drawing, and `sprite.test.ts` holds its colours to the `--fg-*` tokens and checks that the pointing arm is a staircase whose every step shares an edge (a diagonal of single cells reads as dots). Its job is the hero carousel, which turned by itself with nothing saying what each window is: once the dots come into view it walks in from the right edge along them, stops beside them, points up at the window and names the shot; it keeps naming each one as the carousel turns, and a click on it or on what it says turns to the next. Hovering it, or keyboard focus inside it, holds the carousel, like hovering the picture; a mascot leaving or gone always releases that hold (a hover that began on the fading mascot once froze the carousel for good, found in review). Dismissed, it hands the keyboard focus to the active dot and stays away for the life of the page (module state: a link back home does not bring it, a reload does). Every load, as lancetta.app's since the user asked for that there. Reduce Motion: it arrives already pointing, with no walk. Not at 48em or below: there is no room right of the dots for what it says (measured: at 820 the bubble ends at 800).

- **It waits for the newsletter prompt.** `NewsletterModal` opens once the page has scrolled 1200px, which at 900px tall is when the dots come into view; the first strip filmed showed the whole walk dimmed and blurred behind the prompt's overlay. The prompt sets `data-newsletter-prompt` on `<html>` while open (`prompt-open.ts`): the mascot does not set out while it is there, and if it opens mid-walk -- on a taller window the dots arrive first, at about 1000px of scroll at 1080 tall -- the mascot steps off and walks in again once it has gone. One already pointing just stays.
- **The carousel's timer is a timeout keyed on the shot**, not an interval: a shot picked with a dot or the mascot gets its full five seconds.
- **Its colours are hex, not `var()`**: an SVG presentation attribute is not a CSS declaration.

**To see it:** `scripts/shot.mjs` films it (`--no-wake --at <fraction> --frames N --every MS`, `--rate`, `--eval`). The newsletter prompt is stored as dismissed unless `--prompt`; `--reduce` emulates Reduce Motion. The mascot arrives a few seconds after its scroll, so film it with `--at` on the dots and about 16 frames 250 ms apart; `--click` runs before the scroll, when the mascot is not there yet, so drive it from `--eval` instead.

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
