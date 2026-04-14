'use client';

import { Accordion, Anchor, Text } from '@mantine/core';

const faqItems = [
  {
    value: 'what',
    question: 'What is FinderGit?',
    answer:
      'FinderGit is a native macOS application that works as a Git-aware file browser. Think of it as Finder\u2019s list view, but with Git status, branch info, inline diffs, and commit/push/pull actions built in.',
  },
  {
    value: 'free',
    question: 'Is FinderGit free?',
    answer: 'sponsor',
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
      'Not entirely. FinderGit is great for everyday operations (status check, commit, push, pull) across many repos at once. For advanced workflows (interactive rebase, cherry-pick, complex merges), you\u2019ll still want a full Git client or the terminal.',
  },
  {
    value: 'unsigned',
    question: 'Why does macOS say the app is from an unidentified developer?',
    answer:
      'FinderGit is not yet signed with an Apple Developer ID certificate. To open it, right-click the app, choose "Open", then click "Open" in the confirmation dialog. You only need to do this once.',
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
      'Only when you explicitly perform an action (commit, push, pull, stage, etc.). FinderGit reads your repository state via git status and git diff \u2014 it never modifies anything without your command.',
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
    answer: 'bug-report',
  },
  {
    value: 'feature',
    question: 'I have an idea for a new feature. Where can I suggest it?',
    answer: 'feature-request',
  },
];

export function FAQ() {
  return (
    <Accordion variant="separated" radius="md">
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Control>{item.question}</Accordion.Control>
          <Accordion.Panel>
            {item.answer === 'sponsor' ? (
              <Text c="dimmed" size="sm">
                Yes, FinderGit is currently free. If you find it useful, consider{' '}
                <Anchor href="https://github.com/sponsors/gfazioli" size="sm">
                  sponsoring the project
                </Anchor>
                .
              </Text>
            ) : item.answer === 'bug-report' ? (
              <Text c="dimmed" size="sm">
                Please open a{' '}
                <Anchor href="https://github.com/gfazioli/findergit-website/issues/new?template=bug_report.yml" size="sm">
                  Bug Report
                </Anchor>{' '}
                on GitHub. Include your FinderGit version, macOS version, and steps to reproduce the issue.
                Screenshots are very helpful!
              </Text>
            ) : item.answer === 'feature-request' ? (
              <Text c="dimmed" size="sm">
                We&apos;d love to hear your ideas! Open a{' '}
                <Anchor href="https://github.com/gfazioli/findergit-website/issues/new?template=feature_request.yml" size="sm">
                  Feature Request
                </Anchor>{' '}
                on GitHub and describe what you&apos;d like FinderGit to do. The more detail you provide, the better
                we can evaluate and prioritize it.
              </Text>
            ) : (
              <Text c="dimmed" size="sm">
                {item.answer}
              </Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
