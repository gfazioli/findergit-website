'use client';

import type { ReactNode } from 'react';
import {
  IconDeviceLaptop,
  IconGift,
  IconInfoCircle,
  IconShieldCheck,
  IconShieldLock,
  type Icon,
} from '@tabler/icons-react';
import { Accordion, Anchor, Text } from '@mantine/core';
import classes from './FAQ.module.css';

export const faqItems: { value: string; question: string; answer: ReactNode }[] = [
  {
    value: 'what',
    question: 'What is FinderGit?',
    answer:
      'FinderGit is a native macOS application that works as a Git-aware file browser. Think of it as Finder’s list view, but with Git status, branch info, inline diffs, and commit/push/pull actions built in.',
  },
  {
    value: 'free',
    question: 'Is FinderGit free?',
    answer: (
      <>
        Yes, FinderGit is currently free. If you find it useful, consider{' '}
        <Anchor href="https://github.com/sponsors/gfazioli" size="sm">
          sponsoring the project
        </Anchor>
        .
      </>
    ),
  },
  {
    value: 'appstore',
    question: 'Is FinderGit on the App Store? How do updates work?',
    answer:
      'FinderGit is distributed directly from findergit.app as a signed and notarized DMG — it’s not on the App Store. Updates are automatic: the app checks for new releases and installs them in place, so you’re always one click away from the latest version.',
  },
  {
    value: 'macos',
    question: 'What macOS version do I need?',
    answer: 'macOS 15 (Sequoia) or later. FinderGit uses APIs available from macOS 15+.',
  },
  {
    value: 'languages',
    question: 'Which languages does FinderGit speak?',
    answer:
      'English, Italian, French, German, and Spanish. FinderGit follows your Mac’s system language automatically — there is no in-app switcher. To use a different language, reorder your preferred languages in System Settings → General → Language & Region.',
  },
  {
    value: 'replace',
    question: 'Does FinderGit replace my Git client?',
    answer:
      'Not entirely — but it covers more ground every release. Day-to-day work happens without leaving the app: status across many repos at once, stage/unstage and discard, commit (with AI-generated messages), push/pull/fetch, stash, creating, renaming, merging, rebasing and deleting branches, worktrees, tags and releases, and keeping forks in sync with their upstream. When a merge or rebase stops on a conflict, FinderGit lists the conflicted files and lets you mark them resolved, then finish or abort. For interactive rebase and cherry-pick you’ll still want a full Git client or the terminal.',
  },
  {
    value: 'kaleidoscope',
    question: 'Can I open a diff in Kaleidoscope?',
    answer: (
      <>
        Yes. With Kaleidoscope installed, an <strong>Open in Kaleidoscope</strong> button appears
        beside <em>Refresh Diff</em> in a file&apos;s detail. It opens the committed version against
        your working copy in a tab named for the file, binary files intact. Nothing to configure:
        FinderGit finds Kaleidoscope by bundle identifier, then by its <code>ksdiff</code> tool,
        then at the conventional path &mdash; and without Kaleidoscope the button is simply not
        drawn. See{' '}
        <Anchor href="/docs/diff-viewer#open-in-kaleidoscope" size="sm">
          Open in Kaleidoscope
        </Anchor>
        .
      </>
    ),
  },
  {
    value: 'github-account',
    question: 'Do I need to connect a GitHub account?',
    answer: (
      <>
        Only for the GitHub-powered extras — the{' '}
        <Anchor href="/docs/account" size="sm">
          Account
        </Anchor>{' '}
        dashboard, the issue / pull-request / star counts in the file browser, and new-star alerts.
        FinderGit reuses the GitHub CLI if it&apos;s already set up, or a personal access token you
        paste into Settings — kept in your Keychain, never written to disk. Plain browsing, Git
        status, diffs and commit / push / pull all work with no GitHub connection at all.{' '}
        <strong>Codeberg, GitLab and Bitbucket repositories need nothing at all</strong> — their
        counts fill in without an account or a token, because those forges answer questions about
        public repositories anonymously. (Bitbucket retired its issue tracker, so its Issues column
        stays empty, and its &quot;stars&quot; are watchers.) See{' '}
        <Anchor href="/docs/github-integration" size="sm">
          GitHub Integration
        </Anchor>{' '}
        for GitHub setup and what each forge covers.
      </>
    ),
  },
  {
    value: 'star-alerts',
    question: 'Can FinderGit tell me when one of my repos gets a star?',
    answer: (
      <>
        Yes. The{' '}
        <Anchor href="/docs/account#new-star-notifications" size="sm">
          Account
        </Anchor>{' '}
        view shows a badge the moment a repository earns a star — naming which repo, not just
        bumping a number — and you can optionally turn on desktop notifications in Settings → Git.
        It checks periodically in the background while the app is running.
      </>
    ),
  },
  {
    value: 'detect',
    question: 'How does FinderGit detect repositories?',
    answer:
      'When you add a root folder, FinderGit recursively scans for directories containing .git/. The scan depth is configurable in Settings (default: 5 levels). Heavy directories like node_modules and DerivedData are automatically skipped.',
  },
  {
    value: 'modify',
    question: 'Does FinderGit modify my repositories?',
    answer:
      'Only when you explicitly perform an action (commit, push, pull, stage, etc.). FinderGit reads your repository state via git status and git diff — it never touches your working tree, your branches or your commits without your command. The one thing it runs on its own is a fetch: once at launch by default, and on a schedule if you turn on Auto Fetch. A fetch only downloads what’s new on your remotes and updates your repository’s record of them — its remote-tracking branches, plus any new tags that come with them. You can turn both off in Settings → Git.',
  },
  {
    value: 'trust',
    question: 'Is it safe to open repositories I don’t fully trust?',
    answer: (
      <>
        That&apos;s what{' '}
        <Anchor href="/docs/repo-trust" size="sm">
          Repo Trust
        </Anchor>{' '}
        is for. FinderGit scans each repository&apos;s auto-run surface — hooks and configuration
        that could execute code when you open, build, or install — without ever running any of it.
        Repos with findings are flagged in the list, and you get an alert when that surface changes
        after a pull.
      </>
    ),
  },
  {
    value: 'verify',
    question: 'How do I verify a download — and what if a virus scanner flags it?',
    answer: (
      <>
        Every release is signed with an Apple Developer ID and notarized by Apple, and each release
        page publishes the SHA-256 of its DMG, so you can confirm the file you downloaded is
        byte-for-byte the one we shipped —{' '}
        <Anchor href="/docs/getting-started#verifying-your-download" size="sm">
          Verifying your download
        </Anchor>{' '}
        has the two commands. Antivirus engines do sometimes flag a notarized Mac app on a
        machine-learning heuristic rather than an actual malware signature. A matching checksum
        can't prove a detection wrong on its own, but together with Apple's notarization scan and a
        clean spctl run it makes a heuristic false positive much the likeliest reading, and we
        report those to the vendor. If the checksum doesn't match, or macOS rejects the file, don't
        open it —{' '}
        <Anchor
          href="mailto:feedback@findergit.app?subject=FinderGit%20download%20verification"
          size="sm"
        >
          tell us
        </Anchor>
        .
      </>
    ),
  },
  {
    value: 'privacy',
    question: 'Does FinderGit send my data anywhere?',
    answer: (
      <>
        No telemetry, ever: FinderGit never reports how you use it or which repositories you open.
        Here is all of the traffic it does make. Git itself talks to your remotes when you fetch,
        pull, push or clone — including the fetch at launch, which is on by default, and the
        optional Auto Fetch. Forge data (issues, pull requests, stars, fork status, avatars) is
        fetched directly from the forge a repo lives on — GitHub with your own credentials;
        Codeberg, GitLab and Bitbucket without credentials, so they are not told who you are —
        though, like any direct request, it reaches them from your own IP address. With a GitHub
        account connected, the Account dashboard, star alerts and the Clone window read from GitHub
        too, and FinderGit reads GitHub’s public status page at launch, when you refresh and after a
        failed request. Commit authors’ avatars come from GitHub or, for other email addresses, from
        a public avatar service that is sent a hash of the address; turn off Show author avatars in
        Settings → Detail View to stop both. The About &amp; Support window loads its sponsors’
        pictures from GitHub. Update checks read the release feed on findergit.app, unless you turn
        automatic checks off in Settings. And the optional{' '}
        <Anchor href="/docs/ai-commit-messages" size="sm">
          AI commit message
        </Anchor>{' '}
        feature: when you click ✨ AI, your staged diff is sent to generate the message — through
        findergit.app by default, where nothing is stored, or straight to the provider you chose,
        which is also asked to check your key when you save it — and nothing is sent unless you ask.
      </>
    ),
  },
  {
    value: 'live',
    question: 'How does the live update work?',
    answer:
      'FinderGit watches your folders for changes in real time. When a file changes inside a watched repository, the status is automatically refreshed within ~300ms.',
  },
  {
    value: 'bug',
    question: 'I found a bug. How do I report it?',
    answer: (
      <>
        Please send us a{' '}
        <Anchor href="mailto:feedback@findergit.app?subject=FinderGit%20bug%20report" size="sm">
          bug report
        </Anchor>{' '}
        by email. Include your FinderGit version, macOS version, and steps to reproduce the issue.
        Screenshots are very helpful!
      </>
    ),
  },
  {
    value: 'feature',
    question: 'I have an idea for a new feature. Where can I suggest it?',
    answer: (
      <>
        We&apos;d love to hear your ideas! Send us a{' '}
        <Anchor
          href="mailto:feedback@findergit.app?subject=FinderGit%20feature%20request"
          size="sm"
        >
          feature request
        </Anchor>{' '}
        by email and describe what you&apos;d like FinderGit to do. The more detail you provide, the
        better we can evaluate and prioritize it.
      </>
    ),
  },
];

/*
 * A small icon on the questions a visitor most likely came with (user,
 * 2026-09-23: on the most important ones, not on every one). Keyed by the
 * item's `value`, so the list the JSON-LD mirrors stays exactly as it is.
 */
const faqIcons: Partial<Record<string, Icon>> = {
  what: IconInfoCircle,
  free: IconGift,
  macos: IconDeviceLaptop,
  trust: IconShieldCheck,
  privacy: IconShieldLock,
};

export function FAQ() {
  return (
    <Accordion
      variant="separated"
      radius="md"
      classNames={{ root: classes.root, item: classes.item }}
    >
      {faqItems.map((item) => {
        const ItemIcon = faqIcons[item.value];
        return (
          <Accordion.Item key={item.value} value={item.value}>
            <Accordion.Control
              icon={
                ItemIcon && (
                  <span className={classes.icon} aria-hidden>
                    <ItemIcon size={16} stroke={1.8} />
                  </span>
                )
              }
            >
              {item.question}
            </Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                {item.answer}
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
