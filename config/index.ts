export default {
  metadata: {
    title: {
      // 58 characters — within the 50-60 OG sweet spot.
      // "Native macOS" + "Git Intelligence" both pull weight in
      // the click decision: the first frames the platform, the
      // second the differentiator over a plain file browser.
      default: 'FinderGit — Native macOS File Browser with Git Intelligence',
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
      site: '@gfazioli',
      creator: '@gfazioli',
    },
    alternates: {
      canonical: './',
    },
  },
  nextraLayout: {
    docsRepositoryBase: 'https://github.com/gfazioli/findergit-website/tree/main/app/docs/',
    sidebar: {
      defaultMenuCollapseLevel: 1,
    },
  },
  head: {
    mantine: {
      nonce: '8IBTHwOdqNKAWeKl7plt8g==',
    },
  },
  gitHub: {
    // Note: the app repo is PRIVATE. Releases API will be configured
    // when a public releases repo is created.
    repo: 'gfazioli/findergit-website',
    apiUrl: 'https://api.github.com',
    releasesUrl: 'https://api.github.com/repos/gfazioli/findergit-website/releases',
  },
  releaseNotes: {
    // External link to the GitHub Releases page — used by the
    // "View full changelog on GitHub" button at the bottom of /docs/release-notes.
    url: 'https://github.com/gfazioli/findergit-website/releases',
    maxReleases: 10,
    // Releases live on the website repo, which ALSO carries the website's
    // own releases (the Mantine/Nextra template tags a `v6.x` release when
    // its packages are bumped). release.sh names every FinderGit app
    // release "FinderGit X.Y.Z"; the feed keeps only releases with this
    // name prefix so a website-internal entry never appears in the app's
    // release notes. (Cross-port: netfox-website would use 'Netfox'.)
    appReleaseNamePrefix: 'FinderGit',
    // How many recent releases to render on the page + in the TOC. The
    // rest stay one click away via "View full changelog on GitHub" at the
    // bottom — the page was growing unbounded. Sliced AFTER the app-name
    // filter so a website template release can't eat a visible slot.
    displayCount: 3,
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
    version: '0.47.0',
    // Publication date of `version`, UTC, written by release.sh next to the
    // version itself. It is the OFFLINE FALLBACK for the homepage release
    // strip: the live date and the release count come from the GitHub
    // releases API, and this is what the strip shows when that call is
    // rate-limited or down. Also the JSON-LD `dateModified`.
    releaseDate: '2026-10-07',
    minMacOS: '15.0',
    downloadUrl: 'https://github.com/gfazioli/findergit-website/releases/latest',
  },
  // Who publishes the site, as Italian law asks every VAT-registered owner to
  // say: the VAT number on the home page (art. 35 DPR 633/72), and name,
  // contact and VAT number reachable from every page (art. 7 D.Lgs. 70/2003).
  // The footer's last line reads these, and so do /docs/legal and
  // /docs/privacy. The contact address (hello@undolog.com) is written in
  // those two pages as a plain markdown link, which is what gets the docs'
  // link style (a JSX <a> in MDX gets none), so it is not kept here. The same
  // values on every Undolog site.
  legal: {
    brand: 'Undolog',
    owner: 'Giovambattista Fazioli',
    vatNumber: '12343751009',
  },
  // The directories FinderGit is listed on, as badges under the hero, in this
  // order. A directory asks for its badge on the site in return for the
  // listing, and some verify it by fetching the home page: the link has to be
  // in the served HTML and carry no nofollow, sponsored or ugc. `width` and
  // `height` are the badge's own, for its aspect ratio; the stylesheet draws
  // every badge at one height.
  directoryBadges: [
    {
      name: 'Product Hunt',
      href: 'https://www.producthunt.com/products/findergit/launches/findergit?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-findergit',
      src: 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1126262&theme=neutral&t=1780989836593',
      alt: "FinderGit - See every Git repo's status from one native Mac window | Product Hunt",
      width: 250,
      height: 54,
    },
    {
      name: 'LaunchNest',
      href: 'https://launchnest.io/p/findergit',
      src: 'https://launchnest.io/badge/findergit.svg?variant=featured',
      alt: 'FinderGit on LaunchNest',
      width: 220,
      height: 56,
    },
    {
      name: 'ProgrammerNeeds',
      href: 'https://programmerneeds.com/tools/findergit?utm_source=maker-site&utm_medium=badge&utm_campaign=findergit',
      src: 'https://programmerneeds.com/api/badge/findergit?v=9',
      alt: 'Find FinderGit on ProgrammerNeeds',
      width: 220,
      height: 54,
    },
  ],
} as const;
