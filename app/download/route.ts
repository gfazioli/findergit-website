import config from '@/config';

// Always run per-request so the link tracks the latest release. The response
// itself is cached on the CDN (see the CACHE_ constants), which is what stops a
// burst of crawler hits from becoming a burst of invocations.
export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 10_000;

/**
 * How many releases to ask GitHub for.
 *
 * Only the newest release carrying a `.dmg` is ever used, so this is purely a
 * margin against non-app releases sitting on top of the list: the website
 * template publishes its own `v6.x` releases into this same repo. Five
 * tolerates four of those in a row, and the payload is 37 KB against the 75 KB
 * of ten (measured against the live API on 2026-09-18). Deliberately NOT
 * `config.releaseNotes.maxReleases`, which sizes the release-notes feed and has
 * no reason to move in step with this.
 */
const RELEASES_PER_PAGE = 5;

/**
 * CDN lifetime of a RESOLVED redirect.
 *
 * An hour is safe because this redirect can only change when a release ships,
 * and two things happen then. `release.sh` commits and pushes the website repo
 * in the same motion, so the deploy invalidates this CDN entry; and the version
 * it bumps is part of the releases fetch's cache key below, so the answer that
 * replaces this one is built from fresh data rather than from a data-cache
 * entry written before the release. The hour is the ceiling for a release
 * published WITHOUT a website deploy, not the expected lag.
 *
 * `max-age=0` keeps the BROWSER out of it: a redirect pinned in someone's cache
 * survives the deploy that would have corrected it. Vercel strips `s-maxage`
 * and `stale-while-revalidate` on the way out, so that is all the browser sees.
 */
const CACHE_RESOLVED = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

/**
 * CDN lifetime of the FALLBACK redirect - the one taken when GitHub is
 * unreachable or answers something unusable.
 *
 * A minute, not an hour, and the difference is the whole point of splitting the
 * two: caching a degraded answer for an hour turns a blip at GitHub into an
 * hour of every visitor landing on the Releases page instead of the download.
 */
const CACHE_FALLBACK = 'public, max-age=0, s-maxage=60';

/**
 * `/download` - redirects straight to the latest macOS `.dmg` instead of the
 * GitHub Releases page. Resolves the asset from the Releases API at request
 * time, so the public URL carries no version and never goes stale.
 *
 * The releases repo also hosts the website template's own `vX` releases, so we
 * skip anything whose name doesn't start with the app prefix and pick the first
 * (newest) release that actually carries a `.dmg`. Any failure falls back to
 * the Releases page so the button is never a dead end.
 *
 * The response is CDN-cacheable on purpose. It used to answer `no-store`, which
 * Vercel's CDN treats as "never cache this", so every hit - and the traffic
 * here is overwhelmingly crawlers, one of which asked seven times in fifteen
 * seconds - invoked the function and re-read the releases payload out of the
 * data cache. Those bytes are billed as ISR reads and Fast Origin Transfer.
 *
 * A `next/link` to this route does not navigate on a click: it fetches the
 * route as RSC first, with an `RSC: 1` header. Given the redirect, that fetch
 * followed the 302 to GitHub, failed on CORS and logged "Failed to fetch RSC
 * payload" before Next fell back to a normal navigation (lancetta.app, whose
 * Download menu entry is such a link, 2026-10-11). Given an empty 204, Next
 * takes the same fallback silently (in `fetch-server-response`, a response
 * that is not a flight response, or has no body, is a plain navigation), and
 * the browser's own request then gets the redirect. Every link here is a
 * plain anchor today, and the Download menu entry goes to GitHub; this keeps
 * the first `next/link` from finding out. Never cached: the RSC fetch carries
 * its own `_rsc` query, and the 204 must not stand in for the redirect.
 */
export async function GET(request?: Request) {
  if (request?.headers.get('rsc') === '1') {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store', Vary: 'RSC' },
    });
  }

  const fallback = config.app.downloadUrl; // GitHub Releases page

  const redirect = (location: string, cacheControl: string) =>
    new Response(null, {
      status: 302,
      headers: { Location: location, 'Cache-Control': cacheControl },
    });

  try {
    // `v` is ignored by GitHub - verified, the response is byte-identical with
    // and without it - and exists only to put the published version into the
    // DATA CACHE key. That cache survives deploys, so without it the first
    // invocation after a release can reuse an entry fetched BEFORE the release,
    // hand back the previous DMG, and now that the response is CDN-cacheable
    // pin that wrong answer for an hour. release.sh bumps config.app.version in
    // the same commit that publishes the release, so the key moves exactly when
    // the answer does.
    const url = `${config.gitHub.releasesUrl}?per_page=${RELEASES_PER_PAGE}&v=${config.app.version}`;
    const baseHeaders: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': config.gitHub.repo.split('/')[1] || 'website',
    };
    const opts = {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    } as const;

    let response: Response;
    if (process.env.GITHUB_TOKEN) {
      response = await fetch(url, {
        ...opts,
        headers: { ...baseHeaders, Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      });
      const rateRemaining = response.headers.get('x-ratelimit-remaining');
      if (response.status === 401 || (response.status === 403 && rateRemaining !== '0')) {
        await response.text(); // release the connection before retrying
        response = await fetch(url, {
          ...opts,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: baseHeaders,
        });
      }
    } else {
      response = await fetch(url, { ...opts, headers: baseHeaders });
    }

    if (!response.ok) return redirect(fallback, CACHE_FALLBACK);

    const releases = await response.json();
    const prefix = config.releaseNotes.appReleaseNamePrefix;
    let dmgUrl: string | undefined;
    if (Array.isArray(releases)) {
      for (const r of releases) {
        if (r?.draft || r?.prerelease) continue;
        // Skip the website template's own releases that share this repo.
        if (typeof r?.name === 'string' && !r.name.startsWith(prefix)) continue;
        const dmg = (r?.assets ?? []).find(
          (a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.dmg')
        );
        if (dmg?.browser_download_url) {
          dmgUrl = dmg.browser_download_url;
          break;
        }
      }
    }

    return dmgUrl ? redirect(dmgUrl, CACHE_RESOLVED) : redirect(fallback, CACHE_FALLBACK);
  } catch {
    return redirect(fallback, CACHE_FALLBACK);
  }
}
