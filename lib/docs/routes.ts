/** Where the docs live. Shared by the server (content loader) and the client (shell). */
export const DOCS_BASE = '/docs';

/** The app router's segment for the docs, as `useSelectedLayoutSegment()` names it */
export const DOCS_SEGMENT = DOCS_BASE.slice(1);

export function toRoute(slug: string[]): string {
  return slug.length === 0 ? DOCS_BASE : `${DOCS_BASE}/${slug.join('/')}`;
}

/** A pathname as the docs routes spell it: no trailing slash (a static export adds one). */
export function normalizeRoute(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isDocsRoute(route: string): boolean {
  return route === DOCS_BASE || route.startsWith(`${DOCS_BASE}/`);
}

/** Fired on `window` when a page adds headings after its first render (the release notes). */
export const TOC_REFRESH_EVENT = 'docs:toc-refresh';
