/**
 * Set on <html> while the newsletter prompt is open (`NewsletterModal`). The
 * hero's mascot waits for it to go before walking in (`CarouselGuide`): the
 * prompt opens once the page has scrolled 1200px, which on a 900px-tall window
 * is about when the carousel's dots come into view and the mascot arrives, and
 * a walk played behind the prompt's overlay is an entrance nobody sees.
 */
export const PROMPT_OPEN_ATTRIBUTE = 'data-newsletter-prompt';

/**
 * Stored as the time the visitor closed the prompt, in milliseconds since the
 * epoch (`NewsletterModal`); `scripts/shot.mjs` writes the time it loads a page
 * to keep the prompt out of its captures, and `NewsletterModal.test.tsx` holds
 * the two to one string.
 */
export const DISMISSED_KEY = 'findergit-newsletter-prompt-dismissed';

/**
 * How long a closed prompt stays closed: twelve hours, so it does not nag on
 * the visit it was closed in, and a later visit sees it again. It was a day
 * (user, 2026-11-27: *"dopo 24h riappare comunque, così non diamo fastidio ma
 * allo stesso tempo torna visibile in visite successive"*), then twelve hours
 * (2026-11-28: *"riduci il reset del popover sui siti web da 24 a 12 ore"*).
 */
export const PROMPT_RETURNS_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * Whether what `DISMISSED_KEY` holds says the prompt was closed less than
 * `PROMPT_RETURNS_AFTER_MS` ago. The `true` an earlier version stored, closed
 * for good, reads as long ago, so those visitors see it once more. A time ahead
 * of `now` (the clock was set back) reads as expired, not as closed for ever.
 */
export function closedRecently(stored: string | null, now: number): boolean {
  const closedAt = Number(stored);
  if (stored === null || !Number.isFinite(closedAt)) {
    return false;
  }
  const elapsed = now - closedAt;
  return elapsed >= 0 && elapsed < PROMPT_RETURNS_AFTER_MS;
}
