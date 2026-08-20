/**
 * The calendar date to show for a release.
 *
 * Two decisions, both of which were wrong on the live site:
 *
 * - `publishedAt`, never `createdAt`. GitHub reports `created_at` as the date of
 *   the commit the tag points at, and the release script creates the GitHub
 *   Release *before* it commits the appcast and config — so the tag lands on
 *   whatever was last on `main`, which between releases is usually the previous
 *   release's commit. v0.25.0 shipped on 6 August and the timeline dated it
 *   1 August; five of the ten releases on the page were wrong this way.
 *   `createdAt` stays as the fallback because a draft release has no
 *   `published_at`.
 * - Pinned to UTC. This is the calendar date of an event, not a local clock
 *   reading, so it must not move with whoever is reading it: v0.26.0 was
 *   published 16:40 UTC and renders as 20 August in New Zealand without this.
 */
export function formatReleaseDate(publishedAt: string | null, createdAt: string): string {
  return new Date(publishedAt ?? createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
