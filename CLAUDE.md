# findergit-website

The site at findergit.app: the landing page, the docs and the downloads for FinderGit. What the four app sites share is in the workspace's `.claude/rules/websites.md`; this file holds what is specific to this one.

## At night

The site is dark only, forced in `app/layout.tsx`; the theme's traps are commented where they apply (`app/layout.tsx`, `theme.ts`, `theme/global.css`).

- **Measure contrast in place**, against the real ground: a DOM walk in a real browser (`scripts/shot.mjs --eval`). Its colour parser reads `rgb()` only; a `lab()` colour (Nextra's text) comes out as a false 1.5:1 and has to be checked by eye.

## Motion and the mascot

`components/Motion`, `components/Mascot` and `scripts/shot.mjs` carry the design and every trap in their comments and tests: read them before changing either. `MascotNote` goes on a few docs pages, never on all of them.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
