import { compileMdx } from 'nextra/compile';
import config from '@/config';
import { formatReleaseDate } from './format-release-date';
import type { Release } from './use-release-notes';

/**
 * A release body is MARKDOWN, not MDX. In MDX a brace opens a JavaScript
 * expression, and that took lancetta.app's release notes down on 2026-09-19
 * the minute a release quoted an agent's raw error object
 * (`{ code = "-32600"; ... }`). Nothing in these notes is ever meant as JSX, so
 * `md` is the correct reading of the input, not a workaround.
 */
const MARKDOWN: Parameters<typeof compileMdx>[1] = { mdxOptions: { format: 'md' } };

/**
 * Compile every body, and let one bad body cost only its own formatting.
 *
 * A body is written by hand on GitHub AFTER the site is built, so it is the
 * least trusted input on the site. Compiled at build time, an uncaught failure
 * would now fail the page for everyone; caught here, that release falls back to
 * its raw text and the others render. The compiler is injected so a test can
 * drive the failing branch without loading nextra's compiler under jsdom.
 */
export async function compileReleaseBodies(
  releases: Release[],
  compile: typeof compileMdx = compileMdx
): Promise<Release[]> {
  return Promise.all(
    releases.map(async (release) => {
      const rawBody = release.body ?? '';
      const common = {
        ...release,
        rawBody,
        displayDate: formatReleaseDate(release.published_at, release.created_at),
      };
      try {
        return { ...common, body: await compile(rawBody, MARKDOWN) };
      } catch {
        return { ...common, body: null };
      }
    })
  );
}

/**
 * Only FinderGit's own releases, newest first, as many as the page shows.
 *
 * The website repo also carries the template's `v6.x` releases, hence the name
 * prefix (see `config.releaseNotes.appReleaseNamePrefix`). Sliced AFTER the
 * filter so a template release cannot eat a visible slot.
 */
export function appReleases(releases: unknown): Release[] {
  if (!Array.isArray(releases)) {
    return [];
  }
  const prefix = config.releaseNotes.appReleaseNamePrefix;
  return releases
    .filter((release) => typeof release?.name === 'string' && release.name.startsWith(prefix))
    .slice(0, config.releaseNotes.displayCount);
}

/**
 * The releases for /docs/release-notes, fetched and compiled at BUILD time.
 *
 * The page used to fetch them in the browser from `/api/github-releases`, which
 * answers 403 to any user agent containing "bot" -- Googlebot's included. The
 * hook never checked the status, so the 403 body threw inside it and the page
 * stayed on its "Loading releases..." skeleton: about 30 words, which Search
 * Console filed under "Crawled - currently not indexed" (2026-09-24).
 * Built here, the releases are in the served HTML for every crawler, whether or
 * not it runs JavaScript, and a visitor's browser makes no request at all.
 *
 * Fresh at every release: release.sh publishes the GitHub release BEFORE it
 * pushes the website commit, so the deploy that follows always sees it -- the
 * same guarantee the page's table of contents has relied on all along.
 *
 * Never throws. An empty list sends the component back to its runtime fetch,
 * which is exactly what the page did before this existed.
 */
export async function loadReleases(fetchImpl: typeof fetch = fetch): Promise<Release[]> {
  const url = `${config.gitHub.releasesUrl}?per_page=${config.releaseNotes.maxReleases}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'findergit-website',
  };
  // Without a token the build shares GitHub's 60 requests/hour with every other
  // build on the same pooled Vercel IP; with one, the owner's 5,000 apply.
  const token = process.env.GITHUB_TOKEN;
  try {
    let response = await fetchImpl(
      url,
      token ? { headers: { ...headers, Authorization: `Bearer ${token}` } } : { headers }
    );
    // A token that is invalid or refused by policy still leaves public
    // releases readable anonymously -- same fallback as the API route.
    if (!response.ok && token) {
      response = await fetchImpl(url, { headers });
    }
    if (!response.ok) {
      return [];
    }
    return await compileReleaseBodies(appReleases(await response.json()));
  } catch {
    return [];
  }
}
