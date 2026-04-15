# FinderGit

The marketing and download site for **[FinderGit](https://findergit.app)** — a native macOS app that brings Git intelligence into a Finder-style file browser.

[![Latest Release](https://img.shields.io/github/v/release/gfazioli/findergit-website?label=Download&color=blue)](https://github.com/gfazioli/findergit-website/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-15%2B-blue)](https://www.apple.com/macos/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## What is FinderGit?

FinderGit is a native macOS app that combines file browsing with Git intelligence. Instead of switching between Finder and a Git client, you get everything in one window:

- **Tree view with columns** — browse files like Finder's list view, with sortable columns for Branch, Status, Changes, Size, and Date Modified
- **Live Git status** — every repository shows its branch, clean/dirty/unpushed state, and number of changed files, updated in real time via FSEvents
- **Diff viewer** — click any modified file to see a colored inline diff
- **Git actions** — stage, unstage, commit, push, pull, fetch, branch switch, all from the UI
- **Native Markdown preview** — press Space on any `.md` file for a rendered preview
- **Smart context menus** — adapts to whether you're on a regular file, a tracked file, or a repository
- **Multiple root folders** — add as many as you want; drop folders from the macOS Finder into the sidebar to add them as roots
- **Auto-updates** — built in via Sparkle

## Download

[**→ Download the latest version**](https://github.com/gfazioli/findergit-website/releases/latest)

After downloading, open the DMG and drag FinderGit into your Applications folder. On first launch, right-click the app → **Open** to bypass Gatekeeper (the app is signed with a free Personal Team — not an Apple Developer ID).

## Requirements

- macOS 15 Sequoia or later
- Xcode Command Line Tools (FinderGit uses the system `git` binary). On a fresh Mac, run once:
  ```bash
  xcode-select --install
  sudo xcodebuild -license
  ```

## Documentation

Full documentation, screenshots and FAQ at **[findergit.app](https://findergit.app)**.

## About this repository

This repo hosts the **marketing site** and **release downloads** for FinderGit. The app source lives in a separate repository.

The site is built with [Next.js 16](https://nextjs.org/), [Mantine 9](https://mantine.dev/) and [Nextra 4](https://nextra.site/).

### Local development

```bash
yarn install
yarn dev
```

Then visit [http://localhost:3000](http://localhost:3000).

## License

MIT
