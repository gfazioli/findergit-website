import config from '@/config';
import { formatReleaseDate } from '@/components/ReleaseNotes/format-release-date';

/**
 * Everything the homepage release strip renders. Deliberately pre-formatted
 * strings rather than dates: the strip is a client component, so anything it
 * receives crosses the server/client boundary, and formatting on the server
 * keeps a single clock and a single locale in play.
 */
export interface ReleaseCadence {
  /**
   * How recently the newest release shipped ("Updated today"), or null once it
   * is old enough that a relative phrase stops being a selling point and
   * starts advertising the gap. The caller falls back to `latestDate`.
   */
  freshness: string | null;
  /** Always set. Calendar date of the newest release, e.g. "August 31, 2026". */
  latestDate: string;
  /** How many app releases have shipped, or null when the live count failed. */
  total: number | null;
  /** Month and year of the FIRST app release, e.g. "April 2026". */
  since: string | null;
}

/** Shape of the fields this module reads off the GitHub releases API. */
export interface ReleaseRecord {
  name?: string | null;
  tag_name?: string | null;
  draft?: boolean;
  created_at?: string | null;
  published_at?: string | null;
}

export interface ReleaseSummary {
  total: number;
  firstISO: string;
  latestISO: string;
}

/**
 * Past this many days the relative phrase is suppressed. A freshness badge is
 * an asset while the pace holds and a liability the moment it does not: at
 * two months the honest thing on the homepage is the plain date, not
 * "Updated 9 weeks ago" above the fold.
 */
const STALE_AFTER_DAYS = 60;

/**
 * Whole days between two instants, counted on the UTC calendar.
 *
 * UTC and not the reader's zone, for the same reason `formatReleaseDate` pins
 * it: the strip prints a calendar date right next to this phrase, and the two
 * have to agree. Counting local days against a UTC-formatted date is how you
 * get "Updated today" beside yesterday's date.
 */
function utcDaysBetween(from: Date, to: Date): number {
  const day = 86_400_000;
  const startOfDay = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / day;
  return startOfDay(to) - startOfDay(from);
}

/**
 * Relative freshness of a release, or null when it should not be shown:
 * an unparseable date, or one older than STALE_AFTER_DAYS.
 *
 * A future date (clock skew between GitHub and the renderer) clamps to today
 * rather than printing "Updated -1 days ago".
 */
export function formatFreshness(latestISO: string, now: Date): string | null {
  const published = new Date(latestISO);
  if (Number.isNaN(published.getTime())) {
    return null;
  }

  const days = utcDaysBetween(published, now);
  if (days >= STALE_AFTER_DAYS) {
    return null;
  }
  if (days <= 0) {
    return 'Updated today';
  }
  if (days === 1) {
    return 'Updated yesterday';
  }
  if (days < 7) {
    return `Updated ${days} days ago`;
  }
  if (days < 14) {
    return 'Updated last week';
  }
  return `Updated ${Math.floor(days / 7)} weeks ago`;
}

/** "April 2026" for the release that started the count. Null if unparseable. */
export function formatSince(firstISO: string): string | null {
  const first = new Date(firstISO);
  if (Number.isNaN(first.getTime())) {
    return null;
  }
  return first.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Reduce a raw releases payload to a count and its endpoints.
 *
 * Two filters, each of which would otherwise put a wrong number on the
 * homepage. The releases live on the WEBSITE repo, which also tags its own
 * `v6.x` template releases, so only names carrying the app prefix count (the
 * same rule `/api/github-releases` applies to the release-notes feed). And
 * drafts are excluded: an authenticated read can see unpublished releases, and
 * counting one claims a release that nobody can download.
 *
 * Returns null rather than a zero count, so a payload that matched nothing
 * degrades to "no count" instead of asserting the app has never shipped.
 */
export function summariseReleases(
  releases: readonly ReleaseRecord[],
  prefix: string
): ReleaseSummary | null {
  const dated = releases
    .filter((r) => typeof r?.name === 'string' && r.name.startsWith(prefix) && r.draft !== true)
    .map((r) => r.published_at ?? r.created_at)
    .filter((at): at is string => typeof at === 'string' && !Number.isNaN(Date.parse(at)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));

  if (dated.length === 0) {
    return null;
  }

  return {
    total: dated.length,
    firstISO: dated[0],
    latestISO: dated[dated.length - 1],
  };
}

/** The summary rendered as the strip's strings. */
export function toCadence(summary: ReleaseSummary, now: Date): ReleaseCadence {
  return {
    freshness: formatFreshness(summary.latestISO, now),
    latestDate: formatReleaseDate(summary.latestISO, summary.latestISO),
    total: summary.total,
    since: formatSince(summary.firstISO),
  };
}

/**
 * What the strip shows with no live data: the version's own publication date
 * out of the config, which release.sh writes in the same commit that publishes
 * the release. No count and no first-release date, because neither is knowable
 * offline and an undercount on the homepage is worse than no number at all.
 */
export function fallbackReleaseCadence(now: Date = new Date()): ReleaseCadence {
  const iso = `${config.app.releaseDate}T12:00:00Z`;
  return {
    freshness: formatFreshness(iso, now),
    latestDate: formatReleaseDate(iso, iso),
    total: null,
    since: null,
  };
}
