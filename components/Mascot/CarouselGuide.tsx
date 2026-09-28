'use client';

import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { IconX } from '@tabler/icons-react';
import { useReducedMotion } from '@mantine/hooks';
import { PROMPT_OPEN_ATTRIBUTE } from '@/components/NewsletterSignup/prompt-open';
import { Mascot } from './Mascot';
import classes from './Mascot.module.css';

type Phase = 'hidden' | 'walking' | 'pointing' | 'leaving';

/** After the dots come into view, a beat for the carousel's own reveal to land. */
export const DELAY_MS = 700;
/** Matches `walk-in` in the stylesheet. */
export const WALK_MS = 2200;
/** Matches the fade on `.hint`. */
const LEAVE_MS = 260;
/** After the newsletter prompt closes, a beat for its overlay to fade. */
export const PROMPT_GONE_MS = 400;

/**
 * What the guide remembers, for the life of the page: module state survives a
 * client navigation and is gone on a reload. Once dismissed it does not walk in
 * again when the reader comes back to the home page through a link; a reload
 * brings it back, as lancetta.app's does (user, 2026-09-24: "facciamolo
 * apparire sempre ad ogni reload della pagina"). Exported for the tests.
 */
export const guideMemory = { dismissed: false };

interface CarouselGuideProps {
  /** What the carousel shows now: the bubble says it. */
  caption: string;
  /** The shot on screen. A new one makes the mascot hop and the bubble speak again. */
  index: number;
  /** Clicking the mascot or what it says turns the carousel to the next shot. */
  onNext: () => void;
  /**
   * True while the pointer is on the mascot or its bubble, or the keyboard's
   * focus is in them, so the caption holds still; false the moment neither is,
   * and always once the mascot leaves.
   */
  onHold: (held: boolean) => void;
}

/**
 * The hero carousel turns by itself every five seconds, with nothing on screen
 * saying what each window is, or that the dots and the picture can be clicked.
 * The mascot says it: the app icon's face, walking -- see `sprite.ts` for the
 * drawing and why it is ours -- comes in along the row of dots from the right
 * once they are in view, stops beside them, raises an arm at the window above
 * and names what it shows. It keeps naming each shot as the carousel turns, and
 * clicking it (or what it says) turns to the next one. lancetta.app's mascot
 * points at the reading that opens a copy of its panel; this one is the
 * FinderGit counterpart, pointed at the only live copy of the product this page
 * has.
 *
 * It arrives on EVERY load, and nothing is decided before mount, so the served
 * markup carries none of it. A reader who asked for reduced motion gets it
 * standing in place, already pointing: settled, not skipped. Not on a phone
 * (the stylesheet): there is no room beside the dots for what it says.
 */
export function CarouselGuide({ caption, index, onNext, onHold }: CarouselGuideProps) {
  const reduced = useReducedMotion();
  // Read when a timer runs out, not when the page mounts: the hook answers
  // `false` on the first render and the real value after it.
  const reducedNow = useRef(reduced);
  const [phase, setPhase] = useState<Phase>('hidden');
  // The phase as the timers and the observers below see it: they run outside
  // React's render, where the state would be a stale closure. Every change goes
  // through `move`, which keeps the two together.
  const phaseNow = useRef<Phase>('hidden');
  const move = useCallback((next: Phase) => {
    phaseNow.current = next;
    setPhase(next);
  }, []);
  const anchor = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const leaving = useRef<number | undefined>(undefined);
  // Why the carousel is held. Two reasons, so that the pointer leaving does not
  // release a hold the keyboard still has, or the other way round.
  const hold = useRef({ pointer: false, focus: false });
  const report = () => onHold(hold.current.pointer || hold.current.focus);

  useEffect(() => {
    const el = anchor.current;
    if (!el || guideMemory.dismissed) {
      return undefined;
    }
    const root = document.documentElement;
    const covered = () => root.hasAttribute(PROMPT_OPEN_ATTRIBUTE);
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    let arrived = false;
    let walkEnd: number | undefined;

    const walkIn = () => {
      if (guideMemory.dismissed || covered() || phaseNow.current !== 'hidden') {
        return;
      }
      if (reducedNow.current) {
        move('pointing');
        return;
      }
      move('walking');
      walkEnd = later(() => {
        if (phaseNow.current === 'walking') {
          move('pointing');
        }
      }, WALK_MS);
    };

    // The newsletter prompt opens on a scroll close to the one that brings the
    // dots into view (at 1200px; the dots arrive at about 1170 on a window 900
    // tall, 1000 on one 1080 tall), and a walk played behind its overlay is one
    // nobody sees. So while it is open the mascot does not set out, and if it
    // opens mid-walk the mascot steps off and walks in again, from the start,
    // once the prompt has gone. One standing and pointing just stays.
    const prompt = new MutationObserver(() => {
      if (covered()) {
        if (phaseNow.current === 'walking') {
          window.clearTimeout(walkEnd);
          move('hidden');
        }
      } else if (arrived) {
        later(walkIn, PROMPT_GONE_MS);
      }
    });
    prompt.observe(root, { attributes: true, attributeFilter: [PROMPT_OPEN_ATTRIBUTE] });

    const arrive = () => {
      arrived = true;
      later(walkIn, DELAY_MS);
    };
    const stop = () => {
      prompt.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
    // Where nothing can say the dots came into view, it comes after the delay.
    if (typeof IntersectionObserver === 'undefined') {
      arrive();
      return stop;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          arrive();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [move]);

  // Reduce Motion switched on mid-walk: land where the walk was going, now.
  useEffect(() => {
    reducedNow.current = reduced;
    if (reduced && phaseNow.current === 'walking') {
      move('pointing');
    }
  }, [reduced, move]);

  // Once it is leaving or gone, nothing on it can hold the carousel: an element
  // that unmounts under the pointer never reports the pointer leaving, and a
  // hold nobody releases stops the carousel for the rest of the page's life.
  useEffect(() => {
    if (
      (phase === 'leaving' || phase === 'hidden') &&
      (hold.current.pointer || hold.current.focus)
    ) {
      hold.current = { pointer: false, focus: false };
      onHold(false);
    }
  }, [phase, onHold]);

  useEffect(() => () => window.clearTimeout(leaving.current), []);

  const dismiss = () => {
    guideMemory.dismissed = true;
    // The keyboard was on the × that is about to go: hand the focus to the dot
    // of the shot on screen, the control the mascot was standing beside, rather
    // than let it drop to the page.
    if (hint.current?.contains(document.activeElement)) {
      anchor.current?.parentElement?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    }
    move('leaving');
    leaving.current = window.setTimeout(() => move('hidden'), LEAVE_MS);
  };

  /**
   * Whether the browser draws the focus on `el`: its own answer to "is this the
   * keyboard?". An engine without the selector (Safari before 15.4, Chrome
   * before 86) says yes to any focus, as this did before round 2.
   */
  const shownFocus = (el: Element) => {
    try {
      return el.matches(':focus-visible');
    } catch {
      return true;
    }
  };

  // Only the KEYBOARD's focus holds. Chrome also focuses a button on a mouse
  // click, and a click is how the mascot is used most: that hold outlived the
  // pointer and froze the carousel until something else took the focus (review
  // of #75, round 2). `:focus-visible` is the browser's own word on which it is,
  // and every focus event decides afresh: a click after a Tab moves the focus
  // without making it visible, and has to let go of the Tab's hold (round 3).
  const focusArrived = (event: FocusEvent<HTMLDivElement>) => {
    hold.current.focus = shownFocus(event.target as Element);
    report();
  };

  // A key pressed after a click can turn the focus ring on with no new focus
  // event (Shift, Escape), and then the keyboard is being used in here. Not
  // every key does: a shortcut (Cmd+C, a zoom) leaves the ring off, and holding
  // on it froze the carousel again (round 4). So the browser is asked once it
  // has handled the key, rather than its rule being guessed here.
  const keyPressed = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    window.requestAnimationFrame(() => {
      if (!hold.current.focus && document.activeElement === target && shownFocus(target)) {
        hold.current.focus = true;
        report();
      }
    });
  };

  const focusLeft = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      hold.current.focus = false;
      report();
    }
  };

  return (
    <div ref={anchor} className={classes.anchor}>
      {phase !== 'hidden' && (
        <div className={classes.lane}>
          <div
            ref={hint}
            className={classes.hint}
            data-phase={phase}
            onMouseEnter={() => {
              hold.current.pointer = true;
              report();
            }}
            onMouseLeave={() => {
              hold.current.pointer = false;
              report();
            }}
            onFocus={focusArrived}
            onBlur={focusLeft}
            onKeyDown={keyPressed}
          >
            <button
              type="button"
              className={classes.walker}
              aria-label="Show the next screenshot"
              onClick={onNext}
            >
              {/* Keyed on the shot, so every new one replays the hop. */}
              <Mascot key={index} walking={phase === 'walking'} pointing={phase === 'pointing'} />
            </button>
            {phase === 'pointing' && (
              <div className={classes.bubble}>
                {/* Named for what it says AND for what it does: the visible
                    "Next" has to be in the name (WCAG 2.5.3), and the arrow
                    is not worth reading out. */}
                <button
                  type="button"
                  className={classes.say}
                  aria-label={`${caption} Next`}
                  onClick={onNext}
                >
                  <span key={index} className={classes.caption}>
                    {caption}
                  </span>
                  <span className={classes.next}>Next →</span>
                </button>
                <button
                  type="button"
                  className={classes.dismiss}
                  aria-label="Dismiss"
                  onClick={dismiss}
                >
                  <IconX size={12} stroke={2.2} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
