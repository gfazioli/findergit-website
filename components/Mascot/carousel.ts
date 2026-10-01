import { useSyncExternalStore } from 'react';

/**
 * What the hero carousel shows now, for the mascot in the corner of the
 * window. Beside the dots, `CarouselGuide` gets the caption from the carousel
 * as props; where there is no room for it there (48em and below), the corner
 * mascot narrates the carousel instead (`ScrollGuide`), and it is mounted
 * outside the carousel. So the carousel publishes here, and the corner reads.
 */
export interface CarouselNow {
  /** What the shot on screen is (`HeroShot.caption`). */
  caption: string;
  /** The shot on screen. A new one is a new caption to fade in. */
  index: number;
  /** Turns the carousel to the next shot. */
  next: () => void;
}

const idle: CarouselNow = { caption: '', index: 0, next: () => undefined };
let now: CarouselNow = idle;
const listeners = new Set<() => void>();

/** The carousel's side: what is on screen now, and how to turn it. */
export function publishCarousel(next: CarouselNow) {
  now = next;
  listeners.forEach((listener) => listener());
}

/** The carousel has gone (a client navigation away from the home page). */
export function clearCarousel() {
  publishCarousel(idle);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The corner's side. `caption` is empty until a carousel has published. */
export function useCarousel(): CarouselNow {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => idle
  );
}
