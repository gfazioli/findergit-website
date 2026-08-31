import config from '@/config';
import {
  fallbackReleaseCadence,
  type ReleaseCadence,
  type ReleaseRecord,
  summariseReleases,
  toCadence,
} from './release-cadence';

/** GitHub caps a releases page at 100. 47 app releases as of 0.28.0. */
const PER_PAGE = 100;
/** Enough for 500 releases. A bound, so a paging bug cannot loop the build. */
const MAX_PAGES = 5;
const TIMEOUT_MS = 10_000;

/**
 * The release count and dates behind the homepage strip, read straight from
 * the GitHub releases API on the server.
 *
 * Server-side and not through `/api/github-releases`, for three reasons: that
 * route slices the payload to the three releases the notes page renders, so it
 * cannot produce a total; it answers 403 to any user agent that looks like a
 * crawler, which is exactly who should see the freshness signal; and reaching
 * it from the client would keep the numbers out of the initial HTML, which on
 * this site has already once read as a failed deploy.
 *
 * Deliberately UNAUTHENTICATED even where GITHUB_TOKEN is set: an
 * authenticated read can see draft releases, and a draft must not be counted.
 * Next's data cache plus the page's `revalidate` keep this to roughly one
 * request an hour, well inside the 60/hr anonymous budget.
 *
 * Never throws. Any failure returns the config-derived fallback, so the strip
 * renders a correct date with no count rather than disappearing.
 */
export async function fetchReleaseCadence(now: Date = new Date()): Promise<ReleaseCadence> {
  try {
    const collected: ReleaseRecord[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await fetch(
        `${config.gitHub.releasesUrl}?per_page=${PER_PAGE}&page=${page}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'findergit-website',
          },
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );

      if (!response.ok) {
        // Bail out entirely rather than summarising what did arrive: a partial
        // read yields an UNDERCOUNT, and a wrong number on the homepage is
        // worse than no number. The fallback drops the count line.
        return fallbackReleaseCadence(now);
      }

      const batch: unknown = await response.json();
      if (!Array.isArray(batch)) {
        return fallbackReleaseCadence(now);
      }

      collected.push(...(batch as ReleaseRecord[]));
      if (batch.length < PER_PAGE) {
        break;
      }
    }

    const summary = summariseReleases(collected, config.releaseNotes.appReleaseNamePrefix);
    return summary ? toCadence(summary, now) : fallbackReleaseCadence(now);
  } catch {
    return fallbackReleaseCadence(now);
  }
}
