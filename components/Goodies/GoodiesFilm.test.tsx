import { act, fireEvent, render, screen } from '@/test-utils';
import { GoodiesFilm } from './GoodiesFilm';

/** A `play()` the test settles by hand: jsdom has no media engine. */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const named = (name: string) => Object.assign(new Error(name), { name });

describe('GoodiesFilm', () => {
  let observers: { callback: IntersectionObserverCallback }[];
  let plays: ReturnType<typeof deferred>[];
  let pause: jest.SpyInstance;

  beforeEach(() => {
    observers = [];
    plays = [];
    // jsdom has none. This one only records its callback, so a test can say
    // when the film scrolls in and out.
    globalThis.IntersectionObserver = class {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      const next = deferred();
      plays.push(next);
      return next.promise;
    });
    pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.restoreAllMocks();
  });

  const scroll = (ratio: number) =>
    act(() => {
      observers[0].callback(
        [{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
        observers[0] as unknown as IntersectionObserver
      );
    });
  const settle = (how: () => void) =>
    act(async () => {
      how();
      await Promise.resolve();
    });
  const film = () => document.querySelector('video') as HTMLVideoElement;

  it('shows no control before the film plays', () => {
    render(<GoodiesFilm />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(film().controls).toBe(false);
    expect(film().getAttribute('preload')).toBe('none');
  });

  it('plays when a quarter of it is on screen and then draws its two controls', async () => {
    render(<GoodiesFilm />);
    scroll(0.1);
    expect(plays).toHaveLength(0);
    scroll(0.3);
    expect(plays).toHaveLength(1);
    await settle(() => plays[0].resolve());
    expect(screen.getByRole('button', { name: 'Pause the film' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play with sound' })).toBeInTheDocument();
    expect(film().controls).toBe(false);
  });

  it('does not bring the browser controls out when the reader scrolls past a film still loading', async () => {
    render(<GoodiesFilm />);
    scroll(0.3);
    scroll(0); // pause() on a pending play() rejects it with an AbortError
    await settle(() => plays[0].reject(named('AbortError')));
    expect(film().controls).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();

    scroll(0.3);
    await settle(() => plays[1].resolve());
    expect(film().controls).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause the film' })).toBeInTheDocument();
  });

  it('leaves the browser controls, and none of its own, when the browser refuses to play', async () => {
    render(<GoodiesFilm />);
    scroll(0.3);
    await settle(() => plays[0].reject(named('NotAllowedError')));
    expect(film().controls).toBe(true);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('takes its own controls back when a refused film plays after all', async () => {
    render(<GoodiesFilm />);
    scroll(0.3);
    await settle(() => plays[0].reject(named('NotAllowedError')));
    scroll(0);
    scroll(0.3);
    await settle(() => plays[1].resolve());
    expect(film().controls).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause the film' })).toBeInTheDocument();
  });

  it('stays paused once the visitor paused it, until they play it again', async () => {
    render(<GoodiesFilm />);
    scroll(0.3);
    await settle(() => plays[0].resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Pause the film' }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play the film' })).toBeInTheDocument();

    scroll(0);
    scroll(0.5);
    expect(plays).toHaveLength(1); // coming back on screen did not start it

    fireEvent.click(screen.getByRole('button', { name: 'Play the film' }));
    expect(plays).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Pause the film' })).toBeInTheDocument();
  });

  it('starts again from the top with its sound, and loses the sound when it leaves the screen', async () => {
    render(<GoodiesFilm />);
    scroll(0.3);
    await settle(() => plays[0].resolve());
    film().currentTime = 12;
    fireEvent.click(screen.getByRole('button', { name: 'Play with sound' }));
    expect(film().muted).toBe(false);
    expect(film().currentTime).toBe(0);
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();

    scroll(0);
    expect(film().muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Play with sound' })).toBeInTheDocument();
  });

  it('gives a visitor who asked for less motion the poster and the browser controls', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    render(<GoodiesFilm />);
    expect(film().controls).toBe(true);
    expect(observers).toHaveLength(0);
    expect(plays).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
