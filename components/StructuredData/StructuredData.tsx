import config from '@/config';

/**
 * JSON-LD structured data (schema.org). Rendered server-side so the markup
 * is in the initial HTML where crawlers read it. Three schemas:
 *
 * - `WebsiteJsonLd` (site-wide, in the root layout): the WebSite + publisher
 *   Organization entity, for the knowledge graph and brand recognition.
 * - `SoftwareApplicationJsonLd` (homepage): the app itself — free, macOS,
 *   developer tool — eligible for an application rich result.
 * - `FaqJsonLd` (FAQ page): the Q&A, eligible for FAQ rich snippets.
 *
 * No `aggregateRating` is emitted — there are no real ratings to cite, and
 * fabricating one violates Google's guidelines.
 */

const SITE = config.metadata.metadataBase.toString().replace(/\/$/, '');

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static, author-controlled JSON — no user input is
      // interpolated, so serializing it directly is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${SITE}/#website`,
            url: `${SITE}/`,
            name: 'FinderGit',
            description: config.metadata.description,
            publisher: { '@id': `${SITE}/#organization` },
            inLanguage: 'en',
          },
          {
            '@type': 'Organization',
            '@id': `${SITE}/#organization`,
            name: 'FinderGit',
            url: `${SITE}/`,
            logo: { '@type': 'ImageObject', url: `${SITE}/icon-512x512.png` },
          },
        ],
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'FinderGit',
        description: config.metadata.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: `macOS ${config.app.minMacOS}+`,
        url: `${SITE}/`,
        downloadUrl: config.app.downloadUrl,
        softwareVersion: config.app.version,
        image: `${SITE}/opengraph-image.jpeg`,
        screenshot: `${SITE}/screenshot-hero-overview.png`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#organization` },
      }}
    />
  );
}

// Plain-text mirror of the visible answers in `components/FAQ/FAQ.tsx`.
// Google requires the schema text to match what's on the page — keep these
// in sync with FAQ.tsx whenever an answer changes.
const FAQ_ENTRIES: { question: string; answer: string }[] = [
  {
    question: 'What is FinderGit?',
    answer:
      'FinderGit is a native macOS application that works as a Git-aware file browser. Think of it as Finder’s list view, but with Git status, branch info, inline diffs, and commit/push/pull actions built in.',
  },
  {
    question: 'Is FinderGit free?',
    answer:
      'Yes, FinderGit is currently free. If you find it useful, consider sponsoring the project.',
  },
  {
    question: 'Is FinderGit on the App Store? How do updates work?',
    answer:
      'FinderGit is distributed directly from findergit.app as a signed and notarized DMG — it’s not on the App Store. Updates are automatic: the app checks for new releases and installs them in place, so you’re always one click away from the latest version.',
  },
  {
    question: 'What macOS version do I need?',
    answer:
      'macOS 15 (Sequoia) or later. FinderGit is built with SwiftUI and uses APIs available from macOS 15+.',
  },
  {
    question: 'Which languages does FinderGit speak?',
    answer:
      'English, Italian, French, German, and Spanish. FinderGit follows your Mac’s system language automatically — there is no in-app switcher.',
  },
  {
    question: 'Does FinderGit replace my Git client?',
    answer:
      'Not entirely — but it covers more ground every release. Day-to-day work happens without leaving the app: status across many repos at once, stage/unstage and discard, commit (with AI-generated messages), push/pull/fetch, branch switching, and keeping forks in sync with their upstream. For advanced surgery (interactive rebase, cherry-pick, complex merges) you’ll still want a full Git client or the terminal.',
  },
  {
    question: 'Do I need to connect a GitHub account?',
    answer:
      'Only for the GitHub-powered extras — the Account dashboard, the issue / pull-request / star counts in the file browser, and new-star alerts. FinderGit reuses the GitHub CLI if it’s already set up, or a personal access token you paste into Settings — kept in your Keychain, never written to disk. Plain browsing, Git status, diffs and commit / push / pull all work with no GitHub connection at all.',
  },
  {
    question: 'Can FinderGit tell me when one of my repos gets a star?',
    answer:
      'Yes. The Account view shows a badge the moment a repository earns a star — naming which repo, not just bumping a number — and you can optionally turn on desktop notifications in Settings → Git. It checks periodically in the background while the app is running.',
  },
  {
    question: 'How does FinderGit detect repositories?',
    answer:
      'When you add a root folder, FinderGit recursively scans for directories containing .git/. The scan depth is configurable in Settings (default: 5 levels). Heavy directories like node_modules and DerivedData are automatically skipped.',
  },
  {
    question: 'Does FinderGit modify my repositories?',
    answer:
      'Only when you explicitly perform an action (commit, push, pull, stage, etc.). FinderGit reads your repository state via git status and git diff — it never modifies anything without your command.',
  },
  {
    question: 'Is it safe to open repositories I don’t fully trust?',
    answer:
      'That’s what Repo Trust is for. FinderGit scans each repository’s auto-run surface — hooks and configuration that could execute code when you open, build, or install — without ever running any of it. Repos with findings are flagged in the list, and you get an alert when that surface changes after a pull.',
  },
  {
    question: 'Does FinderGit send my data anywhere?',
    answer:
      'No telemetry, ever. GitHub data (issues, pull requests, stars, fork status) is fetched directly from api.github.com using your own credentials. The only exception is the optional AI commit message feature: when you click ✨ AI, your staged diff is sent to generate the message — nothing is stored, and nothing is sent unless you ask.',
  },
  {
    question: 'How does the live update work?',
    answer:
      'FinderGit uses macOS FSEvents to monitor file system changes in real time. When a file changes inside a watched repository, the status is automatically refreshed within ~300ms.',
  },
  {
    question: 'I found a bug. How do I report it?',
    answer:
      'Please open a Bug Report on GitHub. Include your FinderGit version, macOS version, and steps to reproduce the issue. Screenshots are very helpful!',
  },
  {
    question: 'I have an idea for a new feature. Where can I suggest it?',
    answer:
      'We’d love to hear your ideas! Open a Feature Request on GitHub and describe what you’d like FinderGit to do. The more detail you provide, the better we can evaluate and prioritize it.',
  },
];

export function FaqJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ENTRIES.map((entry) => ({
          '@type': 'Question',
          name: entry.question,
          acceptedAnswer: { '@type': 'Answer', text: entry.answer },
        })),
      }}
    />
  );
}
