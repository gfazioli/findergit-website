/**
 * Pagefind in the browser.
 *
 * `yarn build` indexes the prerendered HTML into `/_pagefind/` (see `scripts/pagefind-site.mjs`);
 * the page loads Pagefind's own module from there on the first search. Under `next dev` the index
 * exists only after a build has run once, as with Nextra's search.
 */

export interface PagefindSubResult {
  title: string;
  url: string;
  excerpt: string;
}

export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string };
  sub_results: PagefindSubResult[];
}

interface PagefindModule {
  options: (options: Record<string, unknown>) => Promise<void>;
  search: (
    query: string
  ) => Promise<{ results: { id: string; data: () => Promise<PagefindResultData> }[] }>;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

let pagefind: Promise<PagefindModule> | undefined;

export function loadPagefind(): Promise<PagefindModule> {
  pagefind ??= import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ `${basePath}/_pagefind/pagefind.js`
  ).then(async (module: PagefindModule) => {
    await module.options({ excerptLength: 18 });
    return module;
  });
  pagefind.catch(() => {
    pagefind = undefined;
  });
  return pagefind;
}

/**
 * A result URL as the router wants it. Pagefind takes URLs from the indexed file paths: a server
 * build indexes `docs/api.html` (Next.js serves it as `/docs/api`), a static export indexes
 * `docs/api/index.html`, which Pagefind already turns into `/docs/api/`. The base path is left
 * out: the router adds it.
 */
export function toRouterUrl(url: string): string {
  const withoutBase = basePath && url.startsWith(basePath) ? url.slice(basePath.length) : url;
  return withoutBase.replace(/^[^?#]*/, (path) => path.replace(/\.html$/, ''));
}
