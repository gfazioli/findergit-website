import { formatReleaseDate } from './format-release-date';
import type { Release } from './use-release-notes';

/**
 * A release as the page shows it uncompiled: its body as the text GitHub
 * published, its date formatted.
 *
 * Two callers, and one reason:
 * - `compileReleaseBodies` falls back to it for a body that will not compile;
 * - the hook falls back to it for every release when the compiler's chunk will
 *   not load.
 * Either way the releases are shown, never dropped.
 *
 * A module of its own because the hook imports it STATICALLY. `load-releases`
 * brings nextra's compiler, which the hook may only import on demand, and
 * `use-release-notes` brings React and SWR, which the server's import of
 * `load-releases` must not.
 */
export function plainRelease(release: Release): Release {
  return {
    ...release,
    rawBody: release.body ?? '',
    displayDate: formatReleaseDate(release.published_at, release.created_at),
    body: null,
  };
}
