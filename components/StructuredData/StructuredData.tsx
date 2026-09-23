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
        // The machine-readable half of the homepage release strip. Search
        // engines get a 403 from /api/github-releases, so the config value
        // release.sh writes is the only date they can see.
        dateModified: config.app.releaseDate,
        releaseNotes: `${SITE}/docs/release-notes`,
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
export const FAQ_ENTRIES: { question: string; answer: string }[] = [
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
    answer: 'macOS 15 (Sequoia) or later. FinderGit uses APIs available from macOS 15+.',
  },
  {
    question: 'Which languages does FinderGit speak?',
    answer:
      'English, Italian, French, German, and Spanish. FinderGit follows your Mac’s system language automatically — there is no in-app switcher. To use a different language, reorder your preferred languages in System Settings → General → Language & Region.',
  },
  {
    question: 'Does FinderGit replace my Git client?',
    answer:
      'Not entirely — but it covers more ground every release. Day-to-day work happens without leaving the app: status across many repos at once, stage/unstage and discard, commit (with AI-generated messages), push/pull/fetch, stash, creating, renaming, merging, rebasing and deleting branches, worktrees, tags and releases, and keeping forks in sync with their upstream. When a merge or rebase stops on a conflict, FinderGit lists the conflicted files and lets you mark them resolved, then finish or abort. For interactive rebase and cherry-pick you’ll still want a full Git client or the terminal.',
  },
  {
    question: 'Can I open a diff in Kaleidoscope?',
    answer:
      "Yes. With Kaleidoscope installed, an Open in Kaleidoscope button appears beside Refresh Diff in a file's detail. It opens the committed version against your working copy in a tab named for the file, binary files intact. Nothing to configure: FinderGit finds Kaleidoscope by bundle identifier, then by its ksdiff tool, then at the conventional path — and without Kaleidoscope the button is simply not drawn. See Open in Kaleidoscope.",
  },
  {
    question: 'Do I need to connect a GitHub account?',
    answer:
      'Only for the GitHub-powered extras — the Account dashboard, the issue / pull-request / star counts in the file browser, and new-star alerts. FinderGit reuses the GitHub CLI if it\'s already set up, or a personal access token you paste into Settings — kept in your Keychain, never written to disk. Plain browsing, Git status, diffs and commit / push / pull all work with no GitHub connection at all. Codeberg, GitLab and Bitbucket repositories need nothing at all — their counts fill in without an account or a token, because those forges answer questions about public repositories anonymously. (Bitbucket retired its issue tracker, so its Issues column stays empty, and its "stars" are watchers.) See GitHub Integration for GitHub setup and what each forge covers.',
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
      'Only when you explicitly perform an action (commit, push, pull, stage, etc.). FinderGit reads your repository state via git status and git diff — it never touches your working tree, your branches or your commits without your command. The one thing it runs on its own is a fetch: once at launch by default, and on a schedule if you turn on Auto Fetch. A fetch only downloads what’s new on your remotes and updates your repository’s record of them — its remote-tracking branches, plus any new tags that come with them. You can turn both off in Settings → Git.',
  },
  {
    question: 'Is it safe to open repositories I don’t fully trust?',
    answer:
      "That's what Repo Trust is for. FinderGit scans each repository's auto-run surface — hooks and configuration that could execute code when you open, build, or install — without ever running any of it. Repos with findings are flagged in the list, and you get an alert when that surface changes after a pull.",
  },
  {
    question: 'How do I verify a download — and what if a virus scanner flags it?',
    answer:
      "Every release is signed with an Apple Developer ID and notarized by Apple, and each release page publishes the SHA-256 of its DMG, so you can confirm the file you downloaded is byte-for-byte the one we shipped — Verifying your download has the two commands. Antivirus engines do sometimes flag a notarized Mac app on a machine-learning heuristic rather than an actual malware signature. A matching checksum can't prove a detection wrong on its own, but together with Apple's notarization scan and a clean spctl run it makes a heuristic false positive much the likeliest reading, and we report those to the vendor. If the checksum doesn't match, or macOS rejects the file, don't open it — tell us.",
  },
  {
    question: 'Does FinderGit send my data anywhere?',
    answer:
      'No telemetry, ever: FinderGit never reports how you use it or which repositories you open. Here is all of the traffic it does make. Git itself talks to your remotes when you fetch, pull, push or clone — including the fetch at launch, which is on by default, and the optional Auto Fetch. Forge data (issues, pull requests, stars, fork status, avatars) is fetched directly from the forge a repo lives on — GitHub with your own credentials; Codeberg, GitLab and Bitbucket without credentials, so they are not told who you are — though, like any direct request, it reaches them from your own IP address. With a GitHub account connected, the Account dashboard, star alerts and the Clone window read from GitHub too, and FinderGit reads GitHub’s public status page at launch, when you refresh and after a failed request. Commit authors’ avatars come from GitHub or, for other email addresses, from a public avatar service that is sent a hash of the address; turn off Show author avatars in Settings → Detail View to stop both. The About & Support window loads its sponsors’ pictures from GitHub. Update checks read the release feed on findergit.app, unless you turn automatic checks off in Settings. And the optional AI commit message feature: when you click ✨ AI, your staged diff is sent to generate the message — through findergit.app by default, where nothing is stored, or straight to the provider you chose, which is also asked to check your key when you save it — and nothing is sent unless you ask.',
  },
  {
    question: 'How does the live update work?',
    answer:
      'FinderGit watches your folders for changes in real time. When a file changes inside a watched repository, the status is automatically refreshed within ~300ms.',
  },
  {
    question: 'I found a bug. How do I report it?',
    answer:
      'Please send us a bug report by email. Include your FinderGit version, macOS version, and steps to reproduce the issue. Screenshots are very helpful!',
  },
  {
    question: 'I have an idea for a new feature. Where can I suggest it?',
    answer:
      "We'd love to hear your ideas! Send us a feature request by email and describe what you'd like FinderGit to do. The more detail you provide, the better we can evaluate and prioritize it.",
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
