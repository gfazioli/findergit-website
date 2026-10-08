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
- `DirectoryBadges` — the listing directories' badges, from `config.directoryBadges`, each in the place its `placement` names: Product Hunt's alone under the hero, the others in the footer's "Listed on" row under the Support card (`ListedOn`, on every page; the user, 2026-10-08: the hero was getting crowded). The rules are in its comment. Moving them measured home 1,581 → 1,558 KiB (LaunchNest's 30 KB badge is no longer fetched at load), perf 87-90 → 90, LCP 1.96-2.28 → 2.07-2.08 s, docs unchanged at 98; the mascot on the Support card clears the row at 1440, 360 and 320
- `Discord` — the home page's call to action under the FAQ; the invite is `config.community.discord`, also in the navbar, the Community menu, the footer and the FAQ. No Slack: it is being retired
- `Motion` — scroll reveals, rolling figures and the rim light; `Mascot` — the pixel character that narrates the hero carousel, then follows the scroll down to the footer's Support card (both under **Motion** below)
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

**Reveals** (`Reveal`, `revealScope` / `revealItem`, `useReveal`): one IntersectionObserver per scope, one-shot. Every section heading rises. Cards MORPH, squashed and low then the landing spring, with a soft light held just inside their rim at the top right (the icon's sky) and bottom left (its lilac), a blurred glow 3px in rather than a line on the border (the user, 2026-09-29: *"interno e sfumato"*; the same recipe was ported the same day to netfox.app and lancetta.app): the problem cards, the feature cards, the Finder and FinderGit windows, the diff, the Kaleidoscope comparison and the AI commit panel. Badges and pills pop; each In action screenshot comes in from the side it sits on (`left` / `right`) and its copy rises, each on its own way into view (below). Inside the Solution window the Git state arrives AFTER the window lands, row by row (`rowDelay`): the Problem section's plain Finder list turning into FinderGit, which is the one morph on the page that says what the product does. The diff's lines rise top to bottom; the AI message rises line by line after the AI button pops.

**Figures roll** (`ScrollNumber`): the release count in the hero, the Solution window's stars, sizes, sidebar counts and totals, the diff's `+8 -2`, and the "100" in *100% native*. The element's text is only ever the value; the rolling digits are generated content.

**Nothing waits on a script to be seen.** Three states per scope: REST is the served HTML, ARMED (`data-armed`) is set after mount only on what is entirely off screen, REVEALED on the way into view. Only a revealed item has a transition, so arming snaps. **What is on screen from the start comes in too, by CSS alone** (2026-10-01, the user: *"dovrebbero vedersi anche quando l'elemento è già visibile dall'inizio"*, seen on a 27-inch display stood upright, where the carousel and the sections under it sat still): an item at REST plays its entrance once from the first paint, after `--reveal-hold` (400 ms) and its own delay, on the transition's curves, and the odometer rolls the same way. The keyframes name only the starting pose (`from`) and fill only `backwards`, so they end on the layout whether or not a script ever runs; arming sets `animation: none`, so a script that runs takes an item over and a revealed one never plays both. `Motion.css.test.ts` holds that shape and keeps the keyframe poses equal to the armed rules' (the same design and test as netfox.app's). At mount `useReveal` reads where a scope is LAID OUT (`layoutBox`: its offsets), never `getBoundingClientRect`, because during the hold an item at rest is drawn in its starting pose, 48 px down and squashed for a card: a card showing its top few dozen pixels at the bottom of the window measured as off screen, was armed and stayed blank until a scroll (Codex on netfox-website#87). A sweep of 36 heights from 1000 to 2575 at 1440 wide found 5 such scopes on netfox.app before the fix (up to 57 px showing, at 1440x1855), and after it none on any of the three sites, 40 window sizes each. `threshold` is 0. Verified 2026-09-28 on `next start`: the served HTML carries 0 `data-armed` and 90 `data-reveal`; all 13 hiding selectors in the served CSS name `data-armed`; at 1440x900 the page mounts with 65 armed (70 since each In action row became two scopes, 2026-09-29), and after a scroll through the whole page none is left armed or off its pose and no digit is off its value. At 390 17 stay armed for good: they are the Solution window's figures in columns a phone does not display (`visibleFrom="sm"`), so they are never seen, and they roll if the window is widened to show them.

`<html>` carries **`data-scroll-behavior="smooth"`**: app/global.css scrolls `html` smoothly and Next 16 keeps that across a route change without it. Measured from `/docs/faq` at 900 with a click on the logo: the home mounts at 0, 65 armed, nothing revealed out of sight (70 armed and 0 revealed on 2026-09-29, re-measured after the rows became two scopes each).

Mechanics that cost a round:

- **A card that lifts on hover is wrapped, never given the props**: two transforms on one element fight. The wrapper is then the grid cell, so it carries a leftover card's `gridColumn` span, and the card takes `h="100%"` to keep a row level.
- **A centred flex item shrinks to its content**, so a paragraph with a `maw` inside a wrapper sits at the wrapper's left. Put the measure on the wrapper (the Problem caption).
- **Each In action row is two scopes, not one** (2026-09-29, as lancetta.app's hero frames since its b090eba). With one scope for the row, a phone, where the row is one column and the copy sits under its screenshot, fired it with the copy 218-228px below the fold (scrolling at 750px/s at 390x844), so the copy began to rise before it was on screen; at 1440x900 it was 6-45px below. With a scope per column every part starts at the reveal line, 67-83px above the fold on both. Side by side the screenshot is the taller column, so its top reaches the line first and the copy still follows, about 100-150 ms later plus its own 160 ms. `ownReveal` in `Welcome.tsx` puts the scope and item props on the `Grid.Col` itself, as `Reveal` does with a wrapper div, which here would be one more box in the grid. `Welcome.test.tsx` fires the screenshot's observer and requires the copy to stay held: red on the one-scope row.
- **The In action section clips `overflow-x`**: a screenshot 80px out would widen the page for the length of the spring. Sampled mid-slide at 1440: `scrollWidth` stayed 1440.
- **The springs are generated** (`components/Motion/springs.ts`) into the palette's own `:root` block in `theme/global.css`, between `springs:begin` / `springs:end`; `springs.test.ts` fails when they disagree (mutated by hand to prove it). A second `:root` is refused by stylelint as a duplicate selector. Sampled on a landing card at 1440: scaleY 0.70, peak 1.049 at about 500 ms, 0.992, settled by about 1.3 s — the film's 16% overshoot.
- **An armed figure reads zeros once it scrolls in, until its `delay` runs out**: the hold is what makes the roll seen. The Solution window's totals start with the second row (`TALLY_DELAY`, 560 ms); at `rowDelay(5)`, 1000 ms, "000 MB" sat there for about 1.1 s (measured in review).

**The mascot** (`components/Mascot`). The app icon's face come alive: its two halves, the nose, the navy eyes and smile; arms that are the icon's git lines with a commit node for a hand; sky legs. The grids in `sprite.ts` ARE the drawing, and `sprite.test.ts` holds its colours to the `--fg-*` tokens and checks that the pointing arm is a staircase whose every step shares an edge (a diagonal of single cells reads as dots). Its job is the hero carousel, which turned by itself with nothing saying what each window is: once the dots come into view it walks in from the right edge along them, stops beside them, points up at the window and names the shot; it keeps naming each one as the carousel turns, and a click on it or on what it says turns to the next. Hovering it, or KEYBOARD focus inside it, holds the carousel, like hovering the picture (only `:focus-visible` counts, decided afresh on every focus and asked again a frame after a key: Chrome also focuses a button on a mouse click, and that hold froze the carousel after every click, found in review round 2; a click after a Tab kept the Tab's hold, round 3; a shortcut such as Cmd+C, which leaves the ring off, held it, round 4); a mascot leaving or gone always releases that hold (a hover that began on the fading mascot once froze the carousel for good, found in review). Dismissed, here or in either of its other places, it hands the keyboard focus to the active dot and stays away from all three for the life of the page (`guide.ts`, module state: a link back home does not bring it, a reload does). Every load, as lancetta.app's since the user asked for that there. Reduce Motion: it arrives already pointing, with no walk. Not at 48em or below: there is no room right of the dots for what it says (measured: at 820 the bubble ends at 800), and the mascot in the corner narrates the carousel there instead (below).

- **It waits for the newsletter prompt.** `NewsletterModal` opens once the page has scrolled 1200px, which at 900px tall is when the dots come into view; the first strip filmed showed the whole walk dimmed and blurred behind the prompt's overlay. The prompt sets `data-newsletter-prompt` on `<html>` while open (`prompt-open.ts`): the mascot does not set out while it is there, and if it opens mid-walk -- on a taller window the dots arrive first, at about 1000px of scroll at 1080 tall -- the mascot steps off and walks in again once it has gone. One already pointing just stays.
- **The carousel's timer is a timeout keyed on the shot**, not an interval: a shot picked with a dot or the mascot gets its full five seconds.
- **Its colours are hex, not `var()`**: an SVG presentation attribute is not a CSS declaration.

**It follows the scroll** (`ScrollGuide`), ported from netfox.app's fox on 2026-10-01 (the user: *"molto carino il fatto che su netfox la mascotte rimane sempre visibile e poi suggerisca il 'support' nel footer"*). One character in three places (`guide.ts`): beside the dots, in the window's corner, on the footer's Support card; one dismissal sends it from all three.

- **Past the carousel it rides in the corner** (fixed, bottom right, 4 px a cell, 3 on a phone), walks while the page scrolls (`data-moving`) and stands when it stops. A click gives a TIP: the home page's own feature cards (`tips` in `Welcome.tsx`, those whose description is at most 160 characters, so twelve of fifteen), in a bubble that folds once the reader scrolls half a window on; Next goes on, and what the reader asked for is read from a live region. Never two at once: not in the corner while the one beside the dots is on screen.
- **Where the dots leave no room** (`guideFits`, the stylesheet's own 48em query) it comes as soon as the dots are in view and narrates the carousel from the corner: the caption of the shot on screen, live as the carousel turns (`carousel.ts`, which `HeroCarousel` publishes into), and Next turns it. It folds after 8 s, or once the dots are scrolled past; turned by the reader, it stays theirs until then.
- **At the footer it stands on the Support card** (portalled into `#sponsors`, which is `position: relative`) and says the FAQ's own sentence. It goes there once 30% of the card is on screen and leaves once none is. On the home page the card has 112 px above it instead of 56 (`body:has(.fg-home)`), as on netfox.app. Measured at 1440, 1024 and 390: no visible control under the mascot or its bubble.
- **It waits for the newsletter prompt too**: while `data-newsletter-prompt` is on `<html>` it is nowhere, and it comes back once the prompt has gone.
- **A jump straight past the dots is measured, not observed.** An IntersectionObserver reports a change in what is visible, and an instant scroll from below the window to above it, never on screen in between, is none: the reader was past the carousel with no mascot at all (measured with `scrollTo(3200)` at 1440x900; netfox.app's fox has the same hole). The row is measured once each scroll settles (`STILL_MS`) and acted on only when that disagrees with the observer.
- **Its stylesheet is the carousel mascot's** (`Mascot.module.css`): `/` and `/docs/overview` load 5 stylesheets, as main does.

**In the docs** (`MascotNote`, registered in `mdx-components.ts`): the same sprite beside a speech bubble in the home page's bubble language, on five pages, never all of them (the user, 2026-09-29: *"qua e là dove potrebbe essere carino evidenziare o dare il benvenuto"*): welcomes on the docs home and Getting Started, three shortcuts to start with, where the notes also live in the app, where to write. A server component: no JavaScript, the words are the page's own text (its test reads them from `renderToString`), the sprite `aria-hidden`, one CSS hop as the page lands and on hover. `side="right"` with `pointing` points up and left at the bubble; it is never mirrored, because the face is the icon's.

**To see it:** `scripts/shot.mjs` films it (`--no-wake --at <fraction> --frames N --every MS`, `--rate`, `--eval`). The newsletter prompt is stored as dismissed unless `--prompt`; `--reduce` emulates Reduce Motion. The mascot arrives a few seconds after its scroll, so film it with `--at` on the dots and about 16 frames 250 ms apart; `--click` runs before the scroll, when the mascot is not there yet, so drive it from `--eval` instead. The corner's mascot is `[class*="corner"][data-phase]` and the card's `#sponsors [data-phase]`; scope any click to them, because the carousel's mascot is still in the page.

## Performance: what the page costs, measured

Audited 2026-09-29 because the motion looked like the obvious weight; it was not. Lighthouse mobile with applied throttling (`--throttling-method=devtools`: the default simulated mode swung between 3 and 12 s of LCP on this page), local `next start`, before and after: performance 68-71 to 96, LCP 8.6 s to 1.86 s (now equal to FCP), SEO 92 to 100, and on a phone 2,931 KB to 1,044 KB transferred. At rest for 10 s the home page did 0.7-1.2 s of main-thread work and 600 style recalcs; now 0.1-0.2 s and about 80. The rules that got it there:

- **Every `<img>` that is not lazy is preloaded at the top of the document** (React 19's server rendering does it), so below the fold means `loading="lazy"` plus the real `width`/`height`, 2000x1282 for the screenshots, or arriving late shifts the layout. The hero carousel creates each hidden shot one turn ahead instead of stacking all four at load.
- **The hero icon goes through next/image**, WebP at the size it is drawn, `loading="eager"` and `fetchPriority="high"`: `priority` is deprecated in Next 16. The 512px PNG was 271 KB and the page's LCP.
- **Nothing on the client may import `nextra/compile` statically.** `use-release-notes.ts` did, for its fallback, and put the MDX compiler in every page's JavaScript: 470 KB compressed, never run. It imports it where it runs now. `latex` is off: no page has math.
- **An infinite animation moves only `transform` and `opacity`.** The cadence dot and the NEW badges animated box-shadows and repainted the page sixty times a second, forever. Their light is now in pseudo-element layers, and a Mantine Badge clips its root (`overflow: hidden`), so the badge sets `overflow: visible` or its light disappears.
- **Docs images carry `sizes`** (`DocsImage`): without it next/image served the 2048px rendering to an 832px column and the 3840px one to a phone.
- **SEO:** a link's words are its text: an `aria-label` is invisible to the link-text audit, so the rest goes in a `VisuallyHidden`. The home page is in a `<main>`. The sitemap has no `lastModified`: on Vercel a file's mtime is the clone time.
- **A `next start` left running keeps serving the previous build** after a rebuild, so stop it by port (`lsof -ti tcp:<port>`) before measuring. Its process title is `next-server`, so `pkill -f "next start"` misses it.

Left for later, larger: the whole home page is one client component (`Welcome.tsx` is `'use client'`), a 210 ms hydration task with the CPU slowed 4x; and Mantine's CSS is imported whole, about 30 KB render-blocking that the page does not use.

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
