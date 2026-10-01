'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';
import { useReducedMotion } from '@mantine/hooks';
import { PROMPT_OPEN_ATTRIBUTE } from '@/components/NewsletterSignup/prompt-open';
import { useCarousel } from './carousel';
import { DELAY_MS, guideFits } from './CarouselGuide';
import { dismissGuide, guideMemory, onGuideDismissed, sayNext } from './guide';
import { Mascot } from './Mascot';
import classes from './Mascot.module.css';

/** Where the mascot is: nowhere, in the corner of the window, or on the Support card. */
type Place = 'none' | 'corner' | 'card';
type Phase = 'hidden' | 'arriving' | 'here' | 'leaving';
/** Closed; opened to narrate the carousel; opened by the reader for a tip. */
type Bubble = 'closed' | 'carousel' | 'tip';

/** Matches `corner-in` in the stylesheet. */
export const CORNER_IN_MS = 900;
/** Matches `card-in`. */
export const CARD_IN_MS = 420;
/** Matches the fade on the way out. */
export const LEAVE_MS = 260;
/** Matches `hop`: it hops as it arrives, then speaks. */
export const HOP_MS = 420;
/**
 * How long the carousel's caption stays open in the corner when the mascot
 * opened it by itself. Beside the dots it stays, over nothing; in the corner it
 * covers the page, so it folds away and the mascot is left, for a click to
 * open it again.
 */
export const HERO_FOLD_MS = 8000;
/** After the last scroll event, before its legs stop. */
export const STILL_MS = 160;
/**
 * How much of the Support card has to be on screen for the mascot to go to it.
 * It leaves once none of it is, so a card half in view does not send it back
 * and forth.
 */
export const CARD_RATIO = 0.3;

/** What it says on the Support card: the FAQ's own words, so no new claim. */
export const SPONSOR_LINE =
  'FinderGit is currently free. If you find it useful, consider sponsoring the project.';

/** A tip: one of the home page's own feature cards, as the grid words it. */
export interface Tip {
  title: string;
  description: string;
}

/** What the page has said about where the mascot belongs. */
interface Seen {
  /** A beat has passed since the page mounted. */
  ready: boolean;
  /** The carousel's row of dots has been on screen, or is above it. */
  reached: boolean;
  /** The row is on screen now. */
  rowVisible: boolean;
  /** The mascot beside the dots has room to stand there (`CarouselGuide`). */
  heroRoom: boolean;
  /** Enough of the Support card is on screen. */
  card: boolean;
  /** The newsletter prompt is open over the page. */
  covered: boolean;
}

/** Where the mascot belongs, from what the page last said. */
function placeFor(page: Seen): Place {
  // Under the newsletter prompt's overlay a walk is an entrance nobody sees,
  // the same reason `CarouselGuide` waits for it.
  if (guideMemory.dismissed || !page.ready || page.covered) {
    return 'none';
  }
  if (page.card) {
    return 'card';
  }
  // Before the dots, nowhere; beside them, the carousel's mascot, where it has room.
  if (!page.reached || (page.rowVisible && page.heroRoom)) {
    return 'none';
  }
  return 'corner';
}

/** How long what the reader asked for stays in the announcer before it is cleared. */
const SPOKEN_MS = 1500;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The mascot that follows the reader down the home page, ported from
 * netfox.app's fox (its `ScrollGuide`), which the user liked for exactly this
 * (2026-10-01): *"molto carino il fatto che su netfox la mascotte rimane sempre
 * visibile e poi suggerisca il 'support' nel footer"*. Past the carousel it
 * rides in the corner of the window, walking while the page scrolls and
 * standing when it stops; a click on it gives a tip, one of the home page's own
 * feature cards (`tips`, so it makes no claim the page does not), and Next
 * gives the next one. At the footer it goes to the Support card and suggests
 * sponsoring the project, in the FAQ's own words.
 *
 * Where there is no room right of the carousel's dots (48em and below,
 * `guideFits`), `CarouselGuide` does not show, and this one narrates the
 * carousel from the corner instead: once the dots are in view it walks in,
 * hops, and says what the shot on screen is, as the carousel turns
 * (`carousel.ts`); its Next turns it. That folds once the dots are scrolled
 * past, or after 8 s if the reader never touched it. Where there is room, it
 * comes only once the dots are scrolled past. One mascot at a time, then:
 * never in the corner while the one beside the dots is on screen, and never in
 * the corner while it stands on the card.
 *
 * Nothing it says on its own is announced: it moves with the scroll, and a
 * screen reader reading something else should not be interrupted by it. What
 * the reader asks for is, from a live region that comes with the mascot.
 */
export function ScrollGuide({ tips }: { tips: Tip[] }) {
  const reduced = useReducedMotion();
  const reducedNow = useRef(reduced);
  const carousel = useCarousel();
  // Read by the timers and handlers, which run outside React's render.
  const carouselNow = useRef(carousel);
  useEffect(() => {
    carouselNow.current = carousel;
  }, [carousel]);
  const [at, setAt] = useState<Place>('none');
  const [phase, setPhase] = useState<Phase>('hidden');
  // Where it is and what it is doing, as the timers and observers see it.
  // Every change goes through `go`, which keeps the two together.
  const now = useRef<{ at: Place; phase: Phase }>({ at: 'none', phase: 'hidden' });
  const go = useCallback((nextAt: Place, nextPhase: Phase) => {
    now.current = { at: nextAt, phase: nextPhase };
    setAt(nextAt);
    setPhase(nextPhase);
  }, []);
  const [bubble, setBubbleState] = useState<Bubble>('closed');
  const bubbleNow = useRef<Bubble>('closed');
  const setBubble = useCallback((next: Bubble) => {
    bubbleNow.current = next;
    setBubbleState(next);
  }, []);
  const [tip, setTip] = useState(0);
  // The carousel has been narrated from here, once, on arrival.
  const told = useRef(false);
  // The reader turned the carousel from here: the caption is theirs, and does
  // not fold on the timer.
  const turnedByReader = useRef(false);
  // A turn the reader asked for, waiting for the carousel's new caption to say it.
  const sayTurn = useRef(false);
  // What the announcer says: set only by what the reader asks for, and
  // cleared a moment later, so the same tip can be said again and a screen
  // reader reading the page does not meet it a second time.
  const [spoken, setSpoken] = useState('');
  const hush = useRef<number | undefined>(undefined);
  // One hop per mount of the drawing: on arrival, then one per tip or turn.
  const [hops, setHops] = useState(0);
  const [moving, setMoving] = useState(false);
  const movingNow = useRef(false);
  // Narrating the carousel from here: its dots on screen, no room beside them.
  const [narrating, setNarrating] = useState(false);
  // The Support card, once found: the mascot is drawn into it there.
  const [card, setCard] = useState<HTMLElement | null>(null);
  // The mascot's box, in whichever place it is.
  const box = useRef<HTMLDivElement>(null);
  // Where the reader opened a tip: half a window of scroll away, it folds.
  const openedAt = useRef(0);
  // What the page says about where the mascot belongs.
  const seen = useRef<Seen>({
    ready: false,
    reached: false,
    rowVisible: false,
    heroRoom: true,
    card: false,
    covered: false,
  });
  const timers = useRef(new Set<number>());

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const cancelTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  /** Whether the corner is doing the carousel mascot's job: dots in view, no room beside them. */
  const narratingNow = useCallback(() => seen.current.rowVisible && !seen.current.heroRoom, []);

  /**
   * The keyboard was on the mascot, which is about to go: hand the focus to a
   * control on screen rather than let it drop, and without scrolling, so the
   * reader stays where they are. The last one before the mascot on the page
   * that is in view; else any in view; else, with none in view, the last one
   * before it. It rides in the corner at any height of the page, so the
   * control before it in the markup is usually a screen or more away (Codex,
   * round 1 of netfox.app's #83).
   */
  const handFocusBack = useCallback(() => {
    const el = box.current;
    if (!el?.contains(document.activeElement)) {
      return;
    }
    const others = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (other) => !el.contains(other) && other.getClientRects().length > 0
    );
    const before = others.filter(
      (other) => el.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING
    );
    const inView = (other: HTMLElement) => {
      const { top, bottom, left, right } = other.getBoundingClientRect();
      return bottom > 0 && top < window.innerHeight && right > 0 && left < window.innerWidth;
    };
    const target = before.filter(inView).at(-1) ?? others.find(inView) ?? before.at(-1);
    target?.focus({ preventScroll: true });
  }, []);

  const hop = useCallback(() => setHops((count) => count + 1), []);

  /** Once it stands in the corner with the dots in view and no room beside them, it narrates. */
  const arrived = useCallback(
    (place: Place) => {
      hop();
      if (place !== 'corner' || !narratingNow() || told.current) {
        return;
      }
      // The reader may have clicked it in the meantime: what they asked for
      // stays, and folds on their scroll, not on this timer (Codex, round 1
      // of netfox.app's #83).
      const open = () => {
        if (
          now.current.at === 'corner' &&
          now.current.phase === 'here' &&
          narratingNow() &&
          bubbleNow.current === 'closed' &&
          !told.current &&
          carouselNow.current.caption !== ''
        ) {
          told.current = true;
          setBubble('carousel');
          later(() => {
            if (bubbleNow.current === 'carousel' && !turnedByReader.current) {
              setBubble('closed');
            }
          }, HERO_FOLD_MS);
        }
      };
      if (reducedNow.current) {
        open();
      } else {
        later(open, HOP_MS);
      }
    },
    [hop, later, narratingNow, setBubble]
  );

  /** Moves the mascot to where it belongs: out of where it is first, then in. */
  const sync = useCallback(
    function syncPlace() {
      const want = placeFor(seen.current);
      const { at: here, phase: doing } = now.current;
      if (doing === 'leaving' || here === want) {
        return;
      }
      if (here !== 'none') {
        handFocusBack();
        cancelTimers();
        movingNow.current = false;
        setMoving(false);
        setBubble('closed');
        go(here, 'leaving');
        later(
          () => {
            go('none', 'hidden');
            syncPlace();
          },
          reducedNow.current ? 0 : LEAVE_MS
        );
        return;
      }
      if (reducedNow.current) {
        go(want, 'here');
        arrived(want);
        return;
      }
      go(want, 'arriving');
      later(
        () => {
          if (now.current.at === want && now.current.phase === 'arriving') {
            go(want, 'here');
            arrived(want);
          }
        },
        want === 'corner' ? CORNER_IN_MS : CARD_IN_MS
      );
    },
    [arrived, cancelTimers, go, handFocusBack, later, setBubble]
  );

  // Ready a beat after the page mounts, as the one beside the dots is.
  useEffect(() => {
    const id = window.setTimeout(() => {
      seen.current.ready = true;
      sync();
    }, DELAY_MS);
    return () => {
      window.clearTimeout(id);
      cancelTimers();
    };
  }, [sync, cancelTimers]);

  // The newsletter prompt: while it is open the mascot is nowhere, and it comes
  // back to wherever it belongs once the prompt has gone.
  useEffect(() => {
    const root = document.documentElement;
    const page = seen.current;
    page.covered = root.hasAttribute(PROMPT_OPEN_ATTRIBUTE);
    const prompt = new MutationObserver(() => {
      const covered = root.hasAttribute(PROMPT_OPEN_ATTRIBUTE);
      if (covered !== page.covered) {
        page.covered = covered;
        sync();
      }
    });
    prompt.observe(root, { attributes: true, attributeFilter: [PROMPT_OPEN_ATTRIBUTE] });
    return () => prompt.disconnect();
  }, [sync]);

  // The carousel's row of dots: whether the reader has reached it, whether it
  // is on screen, and whether the mascot beside it has room to stand there.
  useEffect(() => {
    const row = document.querySelector('[data-guide-anchor]');
    const page = seen.current;
    // Where nothing can say where the row is, the mascot stays beside it
    // (`CarouselGuide` has its own way in) and never comes to the corner.
    if (!row || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const saw = (visible: boolean, bottom: number) => {
      page.rowVisible = visible;
      // Above the window counts: a page reloaded halfway down has passed it.
      page.reached = visible || bottom <= 0;
      page.heroRoom = guideFits();
      setNarrating(narratingNow());
      if (!visible && bubbleNow.current === 'carousel') {
        setBubble('closed');
      }
      sync();
    };
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      saw(entry.isIntersecting, entry.boundingClientRect.bottom);
    });
    observer.observe(row);
    // An observer reports a CHANGE in what is visible, and a jump straight
    // past the row -- from below the window to above it, never on screen in
    // between -- is none: the reader is past the carousel and the mascot never
    // came (measured: `scrollTo` 3200 px from the top at 1440 x 900, and the
    // same on netfox.app). A jump has no frames in between, so the row is
    // measured once the scroll settles, and only acted on if that differs.
    let settle: number | undefined;
    const scrolled = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const { top, bottom } = row.getBoundingClientRect();
        const visible = bottom > 0 && top < window.innerHeight;
        if (visible !== page.rowVisible || (visible || bottom <= 0) !== page.reached) {
          saw(visible, bottom);
        }
      }, STILL_MS);
    };
    window.addEventListener('scroll', scrolled, { passive: true });
    const resized = () => {
      page.heroRoom = guideFits();
      setNarrating(narratingNow());
      if (!narratingNow() && bubbleNow.current === 'carousel') {
        setBubble('closed');
      }
      sync();
    };
    window.addEventListener('resize', resized);
    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
      window.removeEventListener('scroll', scrolled);
      window.removeEventListener('resize', resized);
    };
  }, [sync, setBubble, narratingNow]);

  // The footer's Support card.
  useEffect(() => {
    const el = document.getElementById('sponsors');
    if (!el || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    setCard(el);
    const page = seen.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const was = page.card;
        if (entry.isIntersecting && entry.intersectionRatio >= CARD_RATIO) {
          page.card = true;
        } else if (!entry.isIntersecting) {
          page.card = false;
        }
        if (page.card !== was) {
          sync();
        }
      },
      { threshold: [0, CARD_RATIO] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  // Its legs go while the page scrolls, and a tip the reader opened folds once
  // they have scrolled half a window on. One listener, passive; the state
  // changes only when it starts and when it stops.
  useEffect(() => {
    let still: number | undefined;
    const scrolled = () => {
      if (now.current.at === 'corner' && now.current.phase === 'here' && !reducedNow.current) {
        if (!movingNow.current) {
          movingNow.current = true;
          setMoving(true);
        }
        window.clearTimeout(still);
        still = window.setTimeout(() => {
          movingNow.current = false;
          setMoving(false);
        }, STILL_MS);
      }
      if (
        bubbleNow.current === 'tip' &&
        Math.abs(window.scrollY - openedAt.current) > window.innerHeight / 2
      ) {
        setBubble('closed');
      }
    };
    window.addEventListener('scroll', scrolled, { passive: true });
    return () => {
      window.clearTimeout(still);
      window.removeEventListener('scroll', scrolled);
    };
  }, [setBubble]);

  // Dismissed here, or beside the dots: it goes from everywhere.
  useEffect(() => onGuideDismissed(sync), [sync]);

  // Reduce Motion switched on mid-way: arrive now, and stand still.
  useEffect(() => {
    reducedNow.current = reduced;
    if (!reduced) {
      return;
    }
    movingNow.current = false;
    setMoving(false);
    if (now.current.phase === 'arriving') {
      cancelTimers();
      go(now.current.at, 'here');
      arrived(now.current.at);
    }
  }, [reduced, arrived, cancelTimers, go]);

  /** Says something the reader asked for, and clears it a moment later. */
  const say = useCallback((words: string) => {
    setSpoken(words);
    window.clearTimeout(hush.current);
    hush.current = window.setTimeout(() => setSpoken(''), SPOKEN_MS);
  }, []);

  // A new shot while it narrates: one hop, as beside the dots; and a turn the
  // reader asked for is said out loud once its caption has arrived.
  const shown = carousel.index;
  const caption = carousel.caption;
  useEffect(() => {
    if (bubbleNow.current === 'carousel') {
      hop();
    }
    if (sayTurn.current) {
      sayTurn.current = false;
      say(caption);
    }
  }, [shown, caption, hop, say]);

  useEffect(() => () => window.clearTimeout(hush.current), []);

  /**
   * The reader asked, on the mascot or on Next: the next tip, in a bubble that
   * is theirs from now on, so it folds only once they scroll on.
   */
  const ask = () => {
    if (tips.length === 0) {
      return;
    }
    // Asked for, the carousel's caption is no longer the mascot's to open.
    told.current = true;
    const next = sayNext(tips.length);
    setTip(next);
    hop();
    say(`${tips[next].title}: ${tips[next].description}`);
    if (bubbleNow.current !== 'tip') {
      openedAt.current = window.scrollY;
      setBubble('tip');
    }
  };

  /** The reader turned the carousel from here: its caption stays open for them. */
  const turn = () => {
    told.current = true;
    turnedByReader.current = true;
    sayTurn.current = true;
    carouselNow.current.next();
    if (bubbleNow.current !== 'carousel') {
      setBubble('carousel');
    }
  };

  /** The mascot itself: lands it if it is on its way in, then turns or tells. */
  const fromMascot = () => {
    const { at: here, phase: doing } = now.current;
    if (here !== 'corner' || doing === 'leaving' || doing === 'hidden') {
      return;
    }
    if (doing === 'arriving') {
      cancelTimers();
      go('corner', 'here');
    }
    if (narratingNow() && carouselNow.current.caption !== '') {
      turn();
    } else {
      ask();
    }
  };

  const dismiss = (
    <button type="button" className={classes.dismiss} aria-label="Dismiss" onClick={dismissGuide}>
      <IconX size={12} stroke={2.2} />
    </button>
  );

  const shownTip = tips[tip];
  const walkerName = narrating
    ? 'Show the next screenshot'
    : bubble === 'tip'
      ? 'Show another tip'
      : 'Show a tip';
  const inCorner = at === 'corner' && (
    <div
      ref={box}
      className={classes.corner}
      data-phase={phase}
      data-moving={moving ? '' : undefined}
      inert={phase === 'leaving'}
    >
      <button type="button" className={classes.walker} aria-label={walkerName} onClick={fromMascot}>
        {/* Keyed on the hop, so every new tip or shot replays it. */}
        <Mascot
          key={`hop-${hops}`}
          walking={phase === 'arriving' || moving}
          pointing={bubble !== 'closed'}
        />
      </button>
      {/* Mounted with the mascot, before anything is said: a live region has
          to be there before its words change to be heard (CodeRabbit on
          netfox.app's #82), and the bubble opens with its words in it. */}
      <div className={classes.announcer} aria-live="polite" aria-atomic="true">
        {spoken}
      </div>
      {bubble !== 'closed' && phase === 'here' && (
        <div className={classes.cornerBubble}>
          {bubble === 'carousel' ? (
            <div className={classes.cornerSay}>
              <span key={`shot-${shown}`} className={classes.caption}>
                {caption}
              </span>
              <button
                type="button"
                className={classes.nextButton}
                aria-label="Next screenshot"
                onClick={turn}
              >
                Next →
              </button>
            </div>
          ) : (
            shownTip && (
              <div className={classes.cornerSay}>
                <span key={`tip-${tip}`} className={classes.caption}>
                  <strong className={classes.tipTitle}>{shownTip.title}</strong>{' '}
                  {shownTip.description}
                </span>
                <button
                  type="button"
                  className={classes.nextButton}
                  aria-label="Next tip"
                  onClick={ask}
                >
                  Next →
                </button>
              </div>
            )
          )}
          {dismiss}
        </div>
      )}
    </div>
  );

  const onCard =
    at === 'card' &&
    card &&
    createPortal(
      <div ref={box} className={classes.card} data-phase={phase} inert={phase === 'leaving'}>
        <span className={classes.sitter}>
          <Mascot key={`hop-${hops}`} pointing />
        </span>
        <div className={classes.cardBubble}>
          <p className={classes.cardLine}>{SPONSOR_LINE}</p>
          {dismiss}
        </div>
      </div>,
      card
    );

  return (
    <>
      {inCorner}
      {onCard}
    </>
  );
}
