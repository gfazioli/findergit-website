'use client';

import { useEffect, useRef, useState } from 'react';
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
  /** True while the pointer is on the mascot or its bubble, so the caption holds still. */
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
  // Read when the delay runs out, not when the page mounts: the hook answers
  // `false` on the first render and the real value after it.
  const reducedNow = useRef(reduced);
  const [phase, setPhase] = useState<Phase>('hidden');
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = anchor.current;
    if (!el || guideMemory.dismissed) {
      return undefined;
    }
    const timers: number[] = [];
    let prompt: MutationObserver | undefined;
    const root = document.documentElement;
    const walkIn = () => {
      if (guideMemory.dismissed) {
        return;
      }
      // The newsletter prompt opens on the same scroll that brings the dots
      // into view, and a walk played behind its overlay is one nobody sees:
      // wait for it to close.
      if (root.hasAttribute(PROMPT_OPEN_ATTRIBUTE)) {
        prompt = new MutationObserver(() => {
          if (!root.hasAttribute(PROMPT_OPEN_ATTRIBUTE)) {
            prompt?.disconnect();
            timers.push(window.setTimeout(walkIn, PROMPT_GONE_MS));
          }
        });
        prompt.observe(root, { attributes: true, attributeFilter: [PROMPT_OPEN_ATTRIBUTE] });
        return;
      }
      if (reducedNow.current) {
        setPhase('pointing');
        return;
      }
      setPhase('walking');
      timers.push(
        window.setTimeout(() => setPhase((now) => (now === 'walking' ? 'pointing' : now)), WALK_MS)
      );
    };
    const arrive = () => timers.push(window.setTimeout(walkIn, DELAY_MS));
    const stop = () => {
      prompt?.disconnect();
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
  }, []);

  // Reduce Motion switched on mid-walk: land where the walk was going, now.
  useEffect(() => {
    reducedNow.current = reduced;
    if (reduced) {
      setPhase((now) => (now === 'walking' ? 'pointing' : now));
    }
  }, [reduced]);

  const dismiss = () => {
    guideMemory.dismissed = true;
    onHold(false);
    setPhase('leaving');
    window.setTimeout(() => setPhase('hidden'), LEAVE_MS);
  };

  return (
    <div ref={anchor} className={classes.anchor}>
      {phase !== 'hidden' && (
        <div className={classes.lane}>
          <div
            className={classes.hint}
            data-phase={phase}
            onMouseEnter={() => onHold(true)}
            onMouseLeave={() => onHold(false)}
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
                <button type="button" className={classes.say} onClick={onNext}>
                  <span key={index} className={classes.caption}>
                    {caption}
                  </span>
                  <span className={classes.next} aria-hidden="true">
                    Next →
                  </span>
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
