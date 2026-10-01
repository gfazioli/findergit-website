/**
 * What the mascot remembers, for the life of the page. It is one character in
 * three places -- beside the hero carousel's dots (`CarouselGuide`), in the
 * corner of the window as the page scrolls, and on the footer's Support card
 * (both `ScrollGuide`) -- so sending it away from one sends it away from all
 * three. Ported from netfox.app's `guide.ts`, whose fox works the same way.
 *
 * Module state survives a client navigation and is gone on a reload: once
 * dismissed it does not come back when the reader returns to the home page
 * through a link, and a reload brings it back, as lancetta.app's and
 * netfox.app's do (user, 2026-09-24, on lancetta.app: "facciamolo apparire
 * sempre ad ogni reload della pagina").
 */
export const guideMemory = {
  dismissed: false,
  /** The last tip it gave, from the corner; -1 before the first. */
  said: -1,
};

/**
 * The next tip to give: one character, so a tip asked for after a trip to
 * the Support card goes on from the last one rather than starting over.
 */
export function sayNext(count: number) {
  guideMemory.said = (guideMemory.said + 1) % count;
  return guideMemory.said;
}

const dismissedListeners = new Set<() => void>();

/** Sends the mascot away from every place it is, for the rest of the page's life. */
export function dismissGuide() {
  guideMemory.dismissed = true;
  dismissedListeners.forEach((listener) => listener());
}

/** Called when the mascot is dismissed anywhere. Returns the unsubscribe. */
export function onGuideDismissed(listener: () => void) {
  dismissedListeners.add(listener);
  return () => {
    dismissedListeners.delete(listener);
  };
}
