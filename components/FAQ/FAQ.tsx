'use client';

import type { ReactNode } from 'react';
import { Accordion, Anchor, Text } from '@mantine/core';

const faqItems: { value: string; question: string; answer: ReactNode }[] = [
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
    answer:
      'macOS 15 (Sequoia) or later. FinderGit is built with SwiftUI and uses APIs available from macOS 15+.',
  },
  {
    value: 'replace',
    question: 'Does FinderGit replace my Git client?',
    answer:
      'Not entirely — but it covers more ground every release. Day-to-day work happens without leaving the app: status across many repos at once, stage/unstage and discard, commit (with AI-generated messages), push/pull/fetch, branch switching, and keeping forks in sync with their upstream. For advanced surgery (interactive rebase, cherry-pick, complex merges) you’ll still want a full Git client or the terminal.',
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
      'Only when you explicitly perform an action (commit, push, pull, stage, etc.). FinderGit reads your repository state via git status and git diff — it never modifies anything without your command.',
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
        is for. FinderGit scans each repository&apos;s auto-run surface — hooks and
        configuration that could execute code when you open, build, or install — without ever
        running any of it. Repos with findings are flagged in the list, and you get an alert when
        that surface changes after a pull.
      </>
    ),
  },
  {
    value: 'privacy',
    question: 'Does FinderGit send my data anywhere?',
    answer: (
      <>
        No telemetry, ever. GitHub data (issues, pull requests, stars, fork status) is fetched
        directly from api.github.com using your own credentials. The only exception is the optional{' '}
        <Anchor href="/docs/ai-commit-messages" size="sm">
          AI commit message
        </Anchor>{' '}
        feature: when you click ✨ AI, your staged diff is sent to generate the message —
        nothing is stored, and nothing is sent unless you ask.
      </>
    ),
  },
  {
    value: 'live',
    question: 'How does the live update work?',
    answer:
      'FinderGit uses macOS FSEvents to monitor file system changes in real time. When a file changes inside a watched repository, the status is automatically refreshed within ~300ms.',
  },
  {
    value: 'bug',
    question: 'I found a bug. How do I report it?',
    answer: (
      <>
        Please open a{' '}
        <Anchor
          href="https://github.com/gfazioli/findergit-website/issues/new?template=bug_report.yml"
          size="sm"
        >
          Bug Report
        </Anchor>{' '}
        on GitHub. Include your FinderGit version, macOS version, and steps to reproduce the issue.
        Screenshots are very helpful!
      </>
    ),
  },
  {
    value: 'feature',
    question: 'I have an idea for a new feature. Where can I suggest it?',
    answer: (
      <>
        We&apos;d love to hear your ideas! Open a{' '}
        <Anchor
          href="https://github.com/gfazioli/findergit-website/issues/new?template=feature_request.yml"
          size="sm"
        >
          Feature Request
        </Anchor>{' '}
        on GitHub and describe what you&apos;d like FinderGit to do. The more detail you provide,
        the better we can evaluate and prioritize it.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <Accordion variant="separated" radius="md">
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Control>{item.question}</Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              {item.answer}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
