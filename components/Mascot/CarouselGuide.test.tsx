import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen } from '@/test-utils';
import { PROMPT_OPEN_ATTRIBUTE } from '@/components/NewsletterSignup/prompt-open';
import { CarouselGuide, DELAY_MS, PROMPT_GONE_MS, WALK_MS } from './CarouselGuide';
import { dismissGuide, guideMemory } from './guide';

type Props = ComponentProps<typeof CarouselGuide>;

describe('CarouselGuide', () => {
  let observers: { callback: IntersectionObserverCallback }[];

  beforeEach(() => {
    guideMemory.dismissed = false;
    observers = [];
    // jsdom has none. This one only records its callback, so a test can say
    // when the dots "come into view".
    globalThis.IntersectionObserver = class {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    jest.useFakeTimers();
  });

  afterEach(() => {
    document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const props = (over: Partial<Props> = {}): Props => ({
    caption: 'The Overview: every repository’s state on one dashboard.',
    index: 0,
    onNext: jest.fn(),
    onHold: jest.fn(),
    ...over,
  });
  const walker = () => screen.queryByRole('button', { name: 'Show the next screenshot' });
  const said = (text: RegExp | string) => screen.queryByText(text);
  const dotsInView = () =>
    act(() =>
      observers
        .at(-1)
        ?.callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
    );
  const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

  it('waits for the dots to come into view, walks in, then points and says what is shown', () => {
    render(<CarouselGuide {...props()} />);
    wait(10_000);
    expect(walker()).toBeNull();

    dotsInView();
    wait(DELAY_MS + 50);
    expect(walker()).toBeInTheDocument();
    expect(said(/The Overview/)).toBeNull();

    wait(WALK_MS);
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('waits for the newsletter prompt to close before walking in behind it', async () => {
    // The prompt opens on the same scroll that brings the dots into view.
    document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(10_000);
    expect(walker()).toBeNull();

    // A MutationObserver reports on a microtask, which fake timers do not run.
    await act(async () => {
      document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
    });
    wait(PROMPT_GONE_MS + 50);
    expect(walker()).toBeInTheDocument();
    wait(WALK_MS);
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('steps off when the prompt opens mid-walk, and walks in again once it has gone', async () => {
    // On a window taller than 900 the dots come into view before the prompt's
    // 1200px, so the prompt can open while the mascot is still walking.
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + 50);
    expect(walker()).toBeInTheDocument();

    await act(async () => {
      document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    });
    expect(walker()).toBeNull();
    wait(WALK_MS + 1000);
    expect(said(/The Overview/)).toBeNull();

    await act(async () => {
      document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
    });
    wait(PROMPT_GONE_MS + 50);
    expect(walker()).toBeInTheDocument();
    expect(said(/The Overview/)).toBeNull();
    wait(WALK_MS);
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('stays where it is if the prompt opens once it is already pointing', async () => {
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    await act(async () => {
      document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    });
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('arrives after the delay where nothing can say the dots are in view', () => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    render(<CarouselGuide {...props()} />);
    wait(DELAY_MS + WALK_MS + 50);
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('names each shot as the carousel turns', () => {
    const { rerender } = render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    rerender(<CarouselGuide {...props({ index: 1, caption: 'Your GitHub account.' })} />);
    expect(said('Your GitHub account.')).toBeInTheDocument();
    expect(said(/The Overview/)).toBeNull();
  });

  it('turns the carousel when the mascot, or what it says, is clicked', () => {
    const onNext = jest.fn();
    render(<CarouselGuide {...props({ onNext })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    fireEvent.click(walker()!);
    fireEvent.click(screen.getByRole('button', { name: /The Overview/ }));
    expect(onNext).toHaveBeenCalledTimes(2);
  });

  it('names what it says for what it does too', () => {
    // The visible "Next" has to be part of the button's name (WCAG 2.5.3).
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    expect(
      screen.getByRole('button', {
        name: 'The Overview: every repository’s state on one dashboard. Next',
      })
    ).toBeInTheDocument();
  });

  it('holds the carousel still while the pointer is on it', () => {
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    fireEvent.mouseEnter(hint);
    fireEvent.mouseLeave(hint);
    expect(onHold.mock.calls).toEqual([[true], [false]]);
  });

  it('holds it for the keyboard too, until both the pointer and the focus have left', () => {
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    act(() => walker()!.focus());
    fireEvent.mouseEnter(hint);
    fireEvent.mouseLeave(hint);
    expect(onHold).toHaveBeenLastCalledWith(true);
    act(() => (document.activeElement as HTMLElement).blur());
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  /** Answer `:focus-visible` as a mouse focus would (`false`), or as an engine without it. */
  // Captured before any test spies on it, so answering twice in one test does
  // not call the spy from inside itself.
  const nativeMatches = Element.prototype.matches;
  const focusVisible = (answer: boolean | 'unknown') => {
    jest.spyOn(Element.prototype, 'matches').mockImplementation(function (
      this: Element,
      selector: string
    ) {
      if (selector !== ':focus-visible') {
        return nativeMatches.call(this, selector);
      }
      if (answer === 'unknown') {
        throw new SyntaxError(`'${selector}' is not a valid selector`);
      }
      return answer;
    });
  };

  it('does not hold it for the focus a mouse click leaves behind', () => {
    // Chrome focuses a button on a click, and a click is how the mascot is used
    // most. That focus is not `:focus-visible`, which jsdom cannot produce by
    // itself: every focus there is visible, so the selector is answered here.
    focusVisible(false);
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    fireEvent.mouseEnter(hint);
    act(() => walker()!.focus());
    fireEvent.click(walker()!);
    fireEvent.mouseLeave(hint);
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  it('lets go of a Tab’s hold when a mouse click moves the focus on', () => {
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    act(() => walker()!.focus());
    expect(onHold).toHaveBeenLastCalledWith(true);
    // Then the mouse: onto the mascot, a click on "Next" (focused, not
    // visibly), and away.
    focusVisible(false);
    fireEvent.mouseEnter(hint);
    act(() => screen.getByRole('button', { name: /Next$/ }).focus());
    fireEvent.mouseLeave(hint);
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  it('holds once a key is pressed after a click, with no new focus', () => {
    focusVisible(false);
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    fireEvent.mouseEnter(hint);
    act(() => walker()!.focus());
    fireEvent.mouseLeave(hint);
    expect(onHold).toHaveBeenLastCalledWith(false);
    // Chrome turns the ring on for Shift, with no new focus event.
    focusVisible(true);
    fireEvent.keyDown(walker()!, { key: 'Shift' });
    wait(20);
    expect(onHold).toHaveBeenLastCalledWith(true);
  });

  it('does not hold for a shortcut pressed after a click', () => {
    // Cmd+C, or a zoom: the browser leaves the ring off, and so does this.
    focusVisible(false);
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    fireEvent.mouseEnter(hint);
    act(() => walker()!.focus());
    fireEvent.mouseLeave(hint);
    fireEvent.keyDown(walker()!, { key: 'c', metaKey: true });
    wait(20);
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  it('holds on any focus where the engine does not know :focus-visible', () => {
    focusVisible('unknown');
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    act(() => walker()!.focus());
    expect(onHold).toHaveBeenLastCalledWith(true);
  });

  it('never leaves the carousel held by a pointer that arrived as it was leaving', () => {
    // Found in review: a hover that starts on the fading mascot is never told
    // the pointer left, because the mascot unmounts under it; the carousel then
    // stopped for the rest of the page's life.
    const onHold = jest.fn();
    render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const hint = walker()!.parentElement!;
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    fireEvent.mouseEnter(hint);
    expect(onHold).toHaveBeenLastCalledWith(true);
    wait(400);
    expect(walker()).toBeNull();
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  it('hands the keyboard focus to the shot on screen when dismissed', () => {
    render(
      <div>
        <button type="button" aria-current="true">
          dot
        </button>
        <CarouselGuide {...props()} />
      </div>
    );
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    act(() => dismiss.focus());
    fireEvent.click(dismiss);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'dot' }));
  });

  it('leaves when dismissed, lets go of the carousel, and stays gone for the rest of the load', () => {
    const onHold = jest.fn();
    const first = render(<CarouselGuide {...props({ onHold })} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    // A click on the × comes with the pointer on the mascot, holding the carousel.
    fireEvent.mouseEnter(walker()!.parentElement!);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onHold).toHaveBeenLastCalledWith(false);
    wait(400);
    expect(walker()).toBeNull();
    first.unmount();

    // Off to the docs and back through a link: the home page mounts again.
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(10_000);
    expect(walker()).toBeNull();
  });

  it('leaves when it is dismissed in the corner of the window or on the Support card', () => {
    render(
      <div>
        <button type="button" aria-current="true">
          dot
        </button>
        <CarouselGuide {...props()} />
      </div>
    );
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    act(() => walker()!.focus());
    act(() => dismissGuide());
    // The keyboard was on it: the focus goes to the dot it stood beside.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'dot' }));
    wait(400);
    expect(walker()).toBeNull();
  });

  it('comes back on the way home if it was never dismissed', () => {
    const first = render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    first.unmount();

    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + WALK_MS + 50);
    expect(said(/The Overview/)).toBeInTheDocument();
  });

  it('stands already pointing, with no walk, for a reader who asked for less motion', () => {
    jest.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList
    );
    render(<CarouselGuide {...props()} />);
    dotsInView();
    wait(DELAY_MS + 50);
    expect(said(/The Overview/)).toBeInTheDocument();
  });
});
