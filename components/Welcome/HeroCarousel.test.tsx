import { act, fireEvent, render, screen } from '@/test-utils';
import { DELAY_MS, WALK_MS } from '@/components/Mascot/CarouselGuide';
import { useCarousel } from '@/components/Mascot/carousel';
import { guideMemory } from '@/components/Mascot/guide';
import { Welcome } from './Welcome';

/**
 * The hero carousel as the page wires it: its timer, and the mascot that holds
 * it and turns it. `CarouselGuide.test.tsx` checks that the mascot ASKS; this
 * checks that the carousel does what it is asked -- a suite that only saw the
 * callbacks fire stayed green with the hold dropped from the timer, the timer
 * back on an interval, or the mascot's click wired to nothing (review, #75).
 */
describe('the hero carousel', () => {
  let observers: { callback: IntersectionObserverCallback; targets: Element[] }[];

  beforeEach(() => {
    guideMemory.dismissed = false;
    observers = [];
    globalThis.IntersectionObserver = class {
      callback: IntersectionObserverCallback;
      targets: Element[] = [];
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe(el: Element) {
        this.targets.push(el);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    jest.useFakeTimers();
  });

  afterEach(() => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.useRealTimers();
  });

  const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));
  const shown = () =>
    screen
      .getAllByRole('button', { name: /^Show screenshot/ })
      .findIndex((dot) => dot.getAttribute('aria-current') === 'true');
  /** How many shots the carousel turns through, read off its dots. */
  const count = () => screen.getAllByRole('button', { name: /^Show screenshot/ }).length;
  const mascot = () => screen.getByRole('button', { name: 'Show the next screenshot' });
  /** Bring the mascot in: its own observer watches the row of dots. */
  const guideArrives = () => {
    const guide = observers.find((o) => o.targets.some((t) => t.className.includes('anchor')));
    act(() =>
      guide?.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    );
    wait(DELAY_MS + WALK_MS + 50);
  };

  it('turns every five seconds, and gives a shot picked by hand its full five', () => {
    render(<Welcome />);
    expect(shown()).toBe(0);
    wait(4900);
    expect(shown()).toBe(0);
    fireEvent.click(screen.getAllByRole('button', { name: /^Show screenshot/ })[2]);
    expect(shown()).toBe(2);
    // An interval would have turned here, 5 s after the page started.
    wait(200);
    expect(shown()).toBe(2);
    wait(4800);
    expect(shown()).toBe(3);
  });

  it('turns when the mascot is clicked', () => {
    render(<Welcome />);
    guideArrives();
    const before = shown();
    fireEvent.click(mascot());
    expect(shown()).toBe((before + 1) % count());
  });

  it('holds still while the pointer is on the mascot, and turns again once it leaves', () => {
    render(<Welcome />);
    guideArrives();
    const hint = mascot().parentElement!;
    fireEvent.mouseEnter(hint);
    const held = shown();
    wait(12_000);
    expect(shown()).toBe(held);
    fireEvent.mouseLeave(hint);
    wait(5000);
    expect(shown()).toBe((held + 1) % count());
  });

  it('tells the mascot in the corner what is on screen, and turns when it asks', () => {
    // The corner narrates the carousel where the dots leave no room for the
    // mascot beside them (`ScrollGuide`), and reads it from `carousel.ts`.
    let heard = { caption: '', next: () => undefined as void };
    function Corner() {
      heard = useCarousel();
      return null;
    }
    render(
      <>
        <Welcome />
        <Corner />
      </>
    );
    expect(heard.caption).toMatch(/^The Overview/);
    act(() => heard.next());
    expect(shown()).toBe(1);
    expect(heard.caption).toMatch(/^Your GitHub account/);
    wait(5000);
    expect(shown()).toBe(2);
    expect(heard.caption).toMatch(/^Cleaning/);
    wait(5000);
    expect(shown()).toBe(3);
    expect(heard.caption).toMatch(/^All your repositories/);
  });
});
