import { act, render, screen } from '@/test-utils';
import { useReveal } from './useReveal';

function Probe() {
  const { ref, armed, revealed } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-testid="probe"
      data-armed={armed ? '' : undefined}
      data-revealed={revealed ? '' : undefined}
    />
  );
}

/** Where the element is laid out when the page mounts: its offsets (`layoutBox`). */
function placeAt(top: number) {
  jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(top);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
}

describe('useReveal', () => {
  let observers: { callback: IntersectionObserverCallback }[];

  beforeEach(() => {
    observers = [];
    // jsdom has none. This one only records its callback, so a test can say
    // when the element "scrolls in".
    globalThis.IntersectionObserver = class {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.restoreAllMocks();
  });

  const scrollIn = () =>
    act(() =>
      observers
        .at(-1)
        ?.callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
    );

  it('never hides what is on screen when the page mounts', () => {
    // What the server drew and the reader may already be looking at: parking
    // it in a starting pose would blank it until the observer fired.
    placeAt(100);
    render(<Probe />);
    expect(screen.getByTestId('probe')).not.toHaveAttribute('data-armed');
    expect(observers).toHaveLength(0);
  });

  it('goes by where the layout puts it, not by the starting pose it is drawn in', () => {
    // Its top 50px show at the bottom of the window; drawn in a card's pose
    // (48px down, squashed from the bottom) it is a box entirely below.
    placeAt(window.innerHeight - 50);
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: window.innerHeight + 12,
      bottom: window.innerHeight + 152,
    } as DOMRect);
    render(<Probe />);
    expect(screen.getByTestId('probe')).not.toHaveAttribute('data-armed');
  });

  it('arms what is below the fold, and reveals it once it scrolls in', () => {
    placeAt(window.innerHeight + 40);
    render(<Probe />);
    const probe = screen.getByTestId('probe');
    expect(probe).toHaveAttribute('data-armed');
    expect(probe).not.toHaveAttribute('data-revealed');
    scrollIn();
    expect(probe).toHaveAttribute('data-revealed');
  });

  it('arms what is above the viewport too, for a reload scrolled halfway down', () => {
    placeAt(-400);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveAttribute('data-armed');
  });

  it('arms nothing where nothing could reveal it', () => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    placeAt(window.innerHeight + 40);
    render(<Probe />);
    expect(screen.getByTestId('probe')).not.toHaveAttribute('data-armed');
  });
});
