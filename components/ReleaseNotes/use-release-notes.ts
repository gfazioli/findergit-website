import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { plainRelease } from './plain-release';

/**
 * The route refused: it answers `{ error }` with GitHub's status, and a 429 for a
 * spent quota, which it tells apart from GitHub's other 403s and its own bot filter.
 * The fetcher used to hand any answer to `res.json()`, so that body arrived as SWR
 * `data` and was read as a list with no releases in it (#68).
 */
export class ReleasesRefused extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`GitHub releases: HTTP ${status}`);
    this.name = 'ReleasesRefused';
    this.status = status;
  }
}

async function fetchReleaseList(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new ReleasesRefused(res.status);
  }
  return res.json();
}

/**
 * What the page says when the fetch failed. Always a string: the Alert renders
 * it as a child, and an `Error` there makes React throw. A rate limit is read
 * from the status, never from the body's text.
 */
export function refusalMessage(err: unknown): string {
  if (err instanceof ReleasesRefused) {
    return err.status === 429
      ? 'Rate limit exceeded. Please try again later.'
      : `The server answered HTTP ${err.status}. Please try again later.`;
  }
  return 'The release notes could not be reached. Please try again later.';
}

export interface Author {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

export interface Release {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: Author;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  /** Null on a draft release, which is why every read of it needs a fallback. */
  published_at: string | null;
  /** `published_at` formatted for display. Set by `useReleaseNotes`. */
  displayDate?: string;
  assets: any[];
  tarball_url: string;
  zipball_url: string;
  /**
   * As GitHub serves it, the markdown; once compiled, the source for
   * `MDXRemote`, or `null` when that one body would not compile -- never a
   * reason to drop the release, since `rawBody` still holds it.
   */
  body: string | null;
  /** The body exactly as GitHub published it, for the plain-text fallback. */
  rawBody?: string;
}

export interface TOC {
  value: string;
  depth: string;
  id: string;
}

/**
 * The releases for the page. `initial` is what the build compiled (see
 * `loadReleases`); when it holds anything the hook returns it as is and the
 * browser never calls the API. Only an empty `initial` -- the build could not
 * reach GitHub -- falls back to fetching at runtime, as the page always did.
 */
export function useReleaseNotes(initial: Release[] = []) {
  const prebuilt = initial.length > 0;

  const [compiledReleases, setCompiledReleases] = useState<Release[]>(initial);

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<{
    releases: Release[];
  }>(prebuilt ? null : '/api/github-releases', fetchReleaseList, {
    // SWR retries a failed fetch without limit by default, backing off to
    // minutes, and against a rate limit every retry spends the quota it waits on.
    shouldRetryOnError: false,
  });

  useEffect(() => {
    if (!prebuilt && data && !isLoading) {
      const releases: Release[] = Array.isArray(data.releases) ? data.releases : [];
      if (releases.length === 0) {
        // Nothing to compile, so the compiler's chunk is not fetched to compile it.
        setCompiledReleases([]);
        return;
      }
      const fetchReleases = async () => {
        try {
          // Imported here, on the fallback, and nowhere else in the browser: the
          // module brings nextra's MDX compiler, and a static import put it in
          // the client JavaScript of EVERY page, 470 KB compressed that the home
          // page downloaded and never ran (Lighthouse, 2026-09-29). The build
          // compiles the releases on the server, so this runs only when it could
          // not.
          const { compileReleaseBodies } = await import('./load-releases');
          setCompiledReleases(await compileReleaseBodies(releases));
        } catch (err) {
          // The chunk did not load. The releases were fetched all the same, so
          // they are shown as the text GitHub published, as one body that will
          // not compile already is. Left empty, the page stayed on its "Loading
          // releases..." skeleton over releases it held. Said in the console,
          // since nothing on the page says the formatting is missing.
          // eslint-disable-next-line no-console
          console.warn('[release-notes] the compiler did not load; showing plain text', err);
          setCompiledReleases(releases.map(plainRelease));
        }
      };
      fetchReleases();
    }
  }, [prebuilt, data, isLoading]);

  // A refused revalidation (SWR asks again when the tab regains focus) keeps the
  // list it already showed. With nothing on screen the refusal is said: keyed on SWR
  // holding an answer, an empty one hid it (CodeRabbit).
  const failure = swrError && compiledReleases.length === 0 ? refusalMessage(swrError) : null;

  return { data: compiledReleases, error: failure, isLoading } as const;
}
