import { act, fireEvent, render, screen } from '@/test-utils';
import { PROMPT_OPEN_ATTRIBUTE } from '@/components/NewsletterSignup/prompt-open';
import { clearCarousel, publishCarousel } from './carousel';
import { DELAY_MS, NO_ROOM_QUERY } from './CarouselGuide';
import { dismissGuide, guideMemory } from './guide';
import {
  CARD_IN_MS,
  CORNER_IN_MS,
  HERO_FOLD_MS,
  HOP_MS,
  LEAVE_MS,
  ScrollGuide,
  SPONSOR_LINE,
  STILL_MS,
  type Tip,
} from './ScrollGuide';

const TIPS: Tip[] = [
  { title: 'Live Git Status', description: 'Branch, state and changed files, updated live.' },
  { title: 'Quick Look', description: 'Press Space to preview any file in-window.' },
];
const SHOTS = ['The Overview: every repository.', 'Your GitHub account.'];

describe('ScrollGuide', () => {
  // jsdom has no IntersectionObserver. This one records what each observer
  // watches, so a test can say what came into view and what left it.
  let watches: { callback: IntersectionObserverCallback; targets: Element[] }[];
  let narrow: boolean;
  let reduced: boolean;
  let turns: jest.Mock;
  // Where the row of dots is, for anything that measures it rather than
  // waiting for its observer; kept in step with what the observer reports.
  let rowRect: Partial<DOMRect>;

  beforeEach(() => {
    guideMemory.dismissed = false;
    guideMemory.said = -1;
    watches = [];
    narrow = false;
    reduced = false;
    globalThis.IntersectionObserver = class {
      callback: IntersectionObserverCallback;
      targets: Element[] = [];
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        watches.push(this);
      }
      observe(target: Element) {
        this.targets.push(target);
      }
      disconnect() {
        this.targets = [];
      }
    } as unknown as typeof IntersectionObserver;
    // The window's width, as the mascot beside the dots asks it (`guideFits`),
    // and Reduce Motion, as Mantine's hook asks it.
    jest.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches:
            (query === NO_ROOM_QUERY && narrow) ||
            (query.includes('prefers-reduced-motion') && reduced),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList
    );
    rowRect = { top: 1190, bottom: 1200 };
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect(
      this: Element
    ) {
      return (this.hasAttribute('data-guide-anchor') ? rowRect : {}) as DOMRect;
    });
    // Rendered, as far as the focus handoff can tell.
    jest.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    turns = jest.fn();
    shot(0);
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => clearCarousel());
    document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** The carousel turning to shot `i`, as `HeroCarousel` publishes it. */
  function shot(i: number) {
    act(() => publishCarousel({ caption: SHOTS[i], index: i, next: turns }));
  }

  const [first, second] = TIPS;
  const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

  function Page() {
    return (
      <div>
        <a href="/in-view">In view</a>
        <div data-guide-anchor="" />
        <a href="/docs">See what it does</a>
        <ScrollGuide tips={TIPS} />
        <footer>
          <div id="sponsors">
            <a href="https://github.com/sponsors/gfazioli">Become a sponsor</a>
          </div>
        </footer>
      </div>
    );
  }

  const row = () => document.querySelector('[data-guide-anchor]')!;
  const sponsors = () => document.getElementById('sponsors')!;
  const fire = (target: Element, entry: Partial<IntersectionObserverEntry>) =>
    act(() =>
      watches
        .filter((watch) => watch.targets.includes(target))
        .forEach((watch) =>
          watch.callback(
            [{ target, ...entry } as IntersectionObserverEntry],
            watch as unknown as IntersectionObserver
          )
        )
    );
  const rowAt = (top: number) => {
    rowRect = { top, bottom: top + 10 };
    return { boundingClientRect: rowRect as DOMRectReadOnly };
  };
  const rowOnScreen = () => fire(row(), { isIntersecting: true, ...rowAt(390) });
  const rowBelow = () => fire(row(), { isIntersecting: false, ...rowAt(1190) });
  const rowPassed = () => fire(row(), { isIntersecting: false, ...rowAt(-20) });
  const cardShowing = (ratio: number) =>
    fire(sponsors(), { isIntersecting: ratio > 0, intersectionRatio: ratio });

  const corner = () => document.querySelector<HTMLElement>('.corner');
  const onCard = () => sponsors().querySelector<HTMLElement>('.card');
  const mascot = () =>
    screen.queryByRole('button', { name: /^(Show (a|another) tip|Show the next screenshot)$/ });
  const announcer = () => corner()?.querySelector('[aria-live]');
  /** What the bubble in the corner shows; the announcer may say the same words. */
  const bubble = () => corner()?.querySelector('.cornerBubble')?.textContent ?? '';

  /** Mounted, a beat later, the dots scrolled past: it walks into the corner and stands. */
  const inTheCorner = () => {
    render(<Page />);
    wait(DELAY_MS);
    rowPassed();
    wait(CORNER_IN_MS);
    expect(corner()).toHaveAttribute('data-phase', 'here');
  };

  it('stays away until the reader reaches the dots', () => {
    render(<Page />);
    wait(DELAY_MS);
    rowBelow();
    wait(10_000);
    expect(corner()).toBeNull();
  });

  it('comes to the corner after a jump straight past the dots, which no observer reports', () => {
    render(<Page />);
    wait(DELAY_MS);
    rowBelow();
    // From below the window to above it with no frame in between: an anchor
    // link or a restored scroll position. Only the scroll event says so.
    rowAt(-2000);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(corner()).toBeNull();
    wait(STILL_MS);
    expect(corner()).toHaveAttribute('data-phase', 'arriving');
  });

  it('comes to the corner once the dots are scrolled past, where the mascot beside them has room', () => {
    render(<Page />);
    wait(DELAY_MS);
    rowOnScreen();
    wait(10_000);
    // The mascot beside the dots is there: one at a time.
    expect(corner()).toBeNull();

    rowPassed();
    expect(corner()).toHaveAttribute('data-phase', 'arriving');
    wait(CORNER_IN_MS);
    expect(corner()).toHaveAttribute('data-phase', 'here');
    // Folded: past the carousel it only rides along.
    expect(screen.queryByText(SHOTS[0])).toBeNull();
    expect(screen.queryByText(first.title)).toBeNull();

    rowOnScreen();
    expect(corner()).toHaveAttribute('data-phase', 'leaving');
    wait(LEAVE_MS);
    expect(corner()).toBeNull();
  });

  it('narrates the carousel from the corner where the dots leave no room, as it turns, then folds', () => {
    narrow = true;
    render(<Page />);
    wait(DELAY_MS);
    rowOnScreen();
    wait(CORNER_IN_MS);
    expect(screen.queryByText(SHOTS[0])).toBeNull();
    wait(HOP_MS);
    expect(screen.getByText(SHOTS[0])).toBeInTheDocument();
    // Arrived on its own, so a screen reader is not interrupted by it.
    expect(announcer()).toHaveTextContent('');
    expect(mascot()).toHaveAccessibleName('Show the next screenshot');

    // The carousel turns by itself: the caption follows, still unannounced.
    shot(1);
    expect(screen.getByText(SHOTS[1])).toBeInTheDocument();
    expect(announcer()).toHaveTextContent('');

    wait(HERO_FOLD_MS);
    expect(screen.queryByText(SHOTS[1])).toBeNull();
    expect(corner()).toHaveAttribute('data-phase', 'here');
  });

  it('turns the carousel on Next, says the new shot, and keeps the caption open for the reader', () => {
    narrow = true;
    render(<Page />);
    wait(DELAY_MS);
    rowOnScreen();
    wait(CORNER_IN_MS + HOP_MS);
    fireEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));
    expect(turns).toHaveBeenCalledTimes(1);
    shot(1);
    expect(bubble()).toContain(SHOTS[1]);
    expect(announcer()).toHaveTextContent(SHOTS[1]);
    // Theirs now: the timer does not fold it.
    wait(HERO_FOLD_MS);
    expect(bubble()).toContain(SHOTS[1]);
    // A click on the mascot itself turns it too.
    fireEvent.click(mascot()!);
    expect(turns).toHaveBeenCalledTimes(2);
  });

  it('folds the narration as soon as the dots are scrolled past', () => {
    narrow = true;
    render(<Page />);
    wait(DELAY_MS);
    rowOnScreen();
    wait(CORNER_IN_MS + HOP_MS);
    expect(screen.getByText(SHOTS[0])).toBeInTheDocument();
    rowPassed();
    expect(screen.queryByText(SHOTS[0])).toBeNull();
    // Past the carousel, a click is a tip again.
    expect(mascot()).toHaveAccessibleName('Show a tip');
  });

  it('gives a tip on a click, out loud, and Next goes on', () => {
    inTheCorner();
    expect(mascot()).toHaveAccessibleName('Show a tip');
    fireEvent.click(mascot()!);
    expect(bubble()).toContain(`${first.title} ${first.description}`);
    expect(announcer()).toHaveTextContent(`${first.title}: ${first.description}`);
    expect(mascot()).toHaveAccessibleName('Show another tip');

    fireEvent.click(screen.getByRole('button', { name: 'Next tip' }));
    expect(bubble()).toContain(`${second.title} ${second.description}`);
    expect(announcer()).toHaveTextContent(`${second.title}: ${second.description}`);
    // Cleared a moment later: the page's text is not said twice to a reader
    // going through it, and the same tip can be said again.
    wait(2000);
    expect(announcer()).toHaveTextContent('');

    // Round again after the last.
    fireEvent.click(screen.getByRole('button', { name: 'Next tip' }));
    expect(bubble()).toContain(first.title);
  });

  it('walks while the page scrolls, and stands when it stops', () => {
    inTheCorner();
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(corner()).toHaveAttribute('data-moving');
    wait(STILL_MS);
    expect(corner()).not.toHaveAttribute('data-moving');
  });

  it('folds a tip the reader opened once they scroll half a window on', () => {
    inTheCorner();
    fireEvent.click(mascot()!);
    expect(bubble()).toContain(first.title);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: window.innerHeight });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(bubble()).toBe('');
    delete (window as { scrollY?: number }).scrollY;
  });

  it('goes to the Support card, in the FAQ’s words, and back to the corner when it has gone', () => {
    inTheCorner();
    cardShowing(0.5);
    expect(corner()).toHaveAttribute('data-phase', 'leaving');
    wait(LEAVE_MS);
    expect(corner()).toBeNull();
    expect(onCard()).toHaveAttribute('data-phase', 'arriving');
    wait(CARD_IN_MS);
    expect(onCard()).toHaveAttribute('data-phase', 'here');
    expect(sponsors()).toHaveTextContent(SPONSOR_LINE);

    // Half out of view, it stays: no back and forth at the edge.
    cardShowing(0.1);
    expect(onCard()).toHaveAttribute('data-phase', 'here');

    cardShowing(0);
    wait(LEAVE_MS);
    expect(onCard()).toBeNull();
    expect(corner()).toHaveAttribute('data-phase', 'arriving');
  });

  it('goes from everywhere when dismissed, and stays gone', () => {
    inTheCorner();
    fireEvent.click(mascot()!);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(guideMemory.dismissed).toBe(true);
    wait(LEAVE_MS);
    expect(corner()).toBeNull();
    cardShowing(0.5);
    rowPassed();
    wait(10_000);
    expect(corner()).toBeNull();
    expect(onCard()).toBeNull();
  });

  it('leaves when the mascot is dismissed beside the dots', () => {
    inTheCorner();
    act(() => dismissGuide());
    wait(LEAVE_MS);
    expect(corner()).toBeNull();
  });

  it('is nowhere while the newsletter prompt is open, and comes back once it has gone', async () => {
    inTheCorner();
    // A MutationObserver reports on a microtask, which fake timers do not run.
    await act(async () => {
      document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    });
    expect(corner()).toHaveAttribute('data-phase', 'leaving');
    wait(LEAVE_MS);
    expect(corner()).toBeNull();
    wait(10_000);
    expect(corner()).toBeNull();

    await act(async () => {
      document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
    });
    expect(corner()).toHaveAttribute('data-phase', 'arriving');
  });

  it('does not set out while the prompt is open when the page is ready', () => {
    document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    render(<Page />);
    wait(DELAY_MS);
    rowPassed();
    wait(10_000);
    expect(corner()).toBeNull();
  });

  it('hands the keyboard focus to a control in view rather than the one before it', () => {
    // Codex, round 1 of netfox.app's #83: the mascot rides in the corner at any
    // height of the page, so the control before it in the markup is usually
    // off screen.
    inTheCorner();
    const inView = screen.getByRole('link', { name: 'In view' });
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect(
      this: Element
    ) {
      return (this === inView ? { top: 100, bottom: 120, left: 20, right: 200 } : {}) as DOMRect;
    });
    act(() => mascot()!.focus());
    rowOnScreen();
    expect(document.activeElement).toBe(inView);
  });

  it('hands the keyboard focus back when it goes', () => {
    inTheCorner();
    act(() => mascot()!.focus());
    rowOnScreen();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'See what it does' }));
  });

  it('is out of reach while it fades out', () => {
    inTheCorner();
    rowOnScreen();
    expect(corner()).toHaveAttribute('inert');
  });

  it('arrives standing, and never walks, for a reader who asked for less motion', () => {
    reduced = true;
    render(<Page />);
    wait(DELAY_MS);
    rowPassed();
    expect(corner()).toHaveAttribute('data-phase', 'here');
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(corner()).not.toHaveAttribute('data-moving');
  });
});
