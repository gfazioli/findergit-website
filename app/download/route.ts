import config from '@/config';

// Always run per-request so the link tracks the latest release (the GitHub API
// response itself is cached for a few minutes via `revalidate`).
export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 10_000;

/**
 * `/download` — redirects straight to the latest macOS `.dmg` instead of the
 * GitHub Releases page. Resolves the asset from the Releases API at request
 * time, so the public URL carries no version and never goes stale.
 *
 * The releases repo also hosts the website template's own `vX` releases, so we
 * skip anything whose name doesn't start with the app prefix and pick the first
 * (newest) release that actually carries a `.dmg`. Any failure falls back to
 * the Releases page so the button is never a dead end.
 */
export async function GET() {
  const fallback = config.app.downloadUrl; // GitHub Releases page

  const redirect = (location: string) =>
    new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });

  try {
    const url = `${config.gitHub.releasesUrl}?per_page=${config.releaseNotes.maxReleases}`;
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

    if (!response.ok) return redirect(fallback);

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

    return redirect(dmgUrl ?? fallback);
  } catch {
    return redirect(fallback);
  }
}
