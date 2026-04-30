export default {
  metadata: {
    title: {
      default: 'FinderGit — Git-aware File Browser for macOS',
      template: '%s | FinderGit',
    },
    description:
      'A native macOS app that combines file browsing with Git intelligence. See branch, status, changes, and diffs for all your repositories at a glance.',
    metadataBase: new URL('https://findergit.app/'),
    keywords: [
      'FinderGit',
      'macOS',
      'Git',
      'file browser',
      'repository manager',
      'SwiftUI',
      'developer tools',
      'git client',
      'Finder alternative',
    ],
    generator: 'Next.js',
    applicationName: 'FinderGit',
    appleWebApp: {
      title: 'FinderGit',
    },
    openGraph: {
      url: './',
      siteName: 'FinderGit',
      locale: 'en_US',
      type: 'website',
    },
    other: {
      'msapplication-TileColor': '#228be6',
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: {
      canonical: './',
    },
  },
  nextraLayout: {
    docsRepositoryBase:
      'https://github.com/gfazioli/findergit-website/tree/main/app/docs/',
    sidebar: {
      defaultMenuCollapseLevel: 1,
    },
  },
  head: {
    mantine: {
      defaultColorScheme: 'dark',
      nonce: '8IBTHwOdqNKAWeKl7plt8g==',
    },
  },
  gitHub: {
    // Note: the app repo is PRIVATE. Releases API will be configured
    // when a public releases repo is created.
    repo: 'gfazioli/findergit-website',
    apiUrl: 'https://api.github.com',
    releasesUrl:
      'https://api.github.com/repos/gfazioli/findergit-website/releases',
  },
  releaseNotes: {
    // External link to the GitHub Releases page — used by the
    // "View full changelog on GitHub" button at the bottom of /docs/release-notes.
    url: 'https://github.com/gfazioli/findergit-website/releases',
    maxReleases: 10,
  },
  search: {
    queryKeyword: 'q',
    minQueryLength: 3,
    limitKeyword: 'limit',
    defaultMaxResults: 5,
    excerptLengthKeyword: 'excerptLength',
    defaultExcerptLength: 30,
    defaultLanguage: 'en',
  },
  app: {
    version: '0.4.1',
    minMacOS: '15.0',
    downloadUrl:
      'https://github.com/gfazioli/findergit-website/releases/latest',
  },
} as const;
