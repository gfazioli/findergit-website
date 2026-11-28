/**
 * The element a `location.hash` names, or `null`: the id may be percent-encoded (a heading in
 * another script), and a malformed escape is no target at all.
 */
export function targetFromHash(hash: string, doc: Document = document): HTMLElement | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) {
    return null;
  }
  try {
    return doc.getElementById(decodeURIComponent(raw));
  } catch {
    return doc.getElementById(raw);
  }
}

/** Index of the panel that holds `target`, or -1 when none of them does. */
export function panelIndexOf(panels: readonly Element[], target: Element | null): number {
  return target ? panels.findIndex((panel) => panel.contains(target)) : -1;
}
