/**
 * The desktop docs sidebar's collapsed state, kept by `useLocalStorage` under this key.
 *
 * `SIDEBAR_COLLAPSED_SCRIPT` runs in `<head>` before the first paint and, when the stored value is
 * `true`, sets `SIDEBAR_COLLAPSED_ATTRIBUTE` on `<html>`: a CSS rule in `SiteShell.module.css` then
 * collapses the navbar until React has read the value, so a collapsed sidebar does not flash open
 * on every load.
 */
export const SIDEBAR_COLLAPSED_KEY = 'docs-sidebar-collapsed';

export const SIDEBAR_COLLAPSED_ATTRIBUTE = 'data-sidebar-collapsed';

export const SIDEBAR_COLLAPSED_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  SIDEBAR_COLLAPSED_KEY
)})==='true')document.documentElement.setAttribute(${JSON.stringify(
  SIDEBAR_COLLAPSED_ATTRIBUTE
)},'')}catch(e){}`;

/** What the pre-paint script reads: whether storage says "collapsed" right now. */
export function isStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}
