/**
 * Whether a feature introduced in `since` still deserves a "New" badge when
 * the app is at `current`.
 *
 * The badge used to be a hardcoded `badge: 'New'` on the card, and nothing
 * ever took it off: four cards were still marked New 25 releases after the
 * features shipped (measured 2026-09-18 — badges set in June/July, the app
 * at 0.38.0). A sticker that never comes off stops meaning anything, and
 * the one card that genuinely is new looks no different from the rest.
 *
 * So the card records the version that introduced the feature, and the
 * badge shows only while the running version is within `window` minor
 * releases of it. `config.app.version` is bumped by release.sh on every
 * release, which is what makes this decay on its own.
 *
 * A different major is never "recent" — 0.38 → 1.0 makes the minor
 * distance meaningless — and a `since` ahead of `current` is not either:
 * that is a card for a feature the shipped app does not have yet, which is
 * a mistake this should not decorate.
 */
export function isRecent(since: string, current: string, window = 2): boolean {
  const a = parse(since);
  const b = parse(current);
  if (!a || !b) return false;
  if (a.major !== b.major) return false;
  const distance = b.minor - a.minor;
  return distance >= 0 && distance <= window;
}

function parse(version: string): { major: number; minor: number } | null {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(version.trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]) };
}
