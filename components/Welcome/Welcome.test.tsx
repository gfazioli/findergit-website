import { act, fireEvent, render, screen, waitFor, within } from '@/test-utils';
import { Welcome } from './Welcome';

/** The feature rows' screenshots (Repo Trust's and In action's), under `root`. */
const featureShots = (root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLImageElement>('img[src*="screenshot-feature"]'),
];

describe('Welcome component', () => {
  it('renders the hero title', () => {
    render(<Welcome />);
    // Only the plain-text half of the headline is asserted: the rest ("Always live.") is rendered
    // by TextAnimate, which splits it per character, so it is not a single text node.
    expect(screen.getByText(/every git repo\. one window\./i)).toBeInTheDocument();
  });

  describe('the sections', () => {
    it('give Repo Trust one of its own, right after the Solution', () => {
      render(<Welcome />);
      const title = 'Catch a supply-chain worm before it runs';
      const trust = screen.getByRole('region', { name: title });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const own = h2s.findIndex((h) => trust.contains(h));
      expect(h2s[own]).toHaveTextContent(title);
      expect(h2s[own - 1]).toHaveTextContent('One window. All your repos. Always live.');

      expect(within(trust).getByRole('link', { name: /^Learn more about/ })).toHaveAttribute(
        'href',
        '/docs/repo-trust'
      );
      const shots = featureShots(trust);
      expect(shots).toHaveLength(1);
      expect(shots[0].getAttribute('src')).toContain('screenshot-feature-trust');
    });

    it('leave In action the four other rows', () => {
      render(<Welcome />);
      const inAction = screen.getByRole('region', {
        name: 'Built around the way you actually work',
      });
      const shots = featureShots(inAction);
      expect(shots).toHaveLength(4);
      expect(shots.some((img) => img.getAttribute('src')?.includes('trust'))).toBe(false);
      expect(
        within(inAction).getByText(/^Four touches that make Git feel native/)
      ).toBeInTheDocument();
    });
  });

  it('serves the feature rows’ screenshots through next/image, lazily, at their column’s width', () => {
    render(<Welcome />);
    const shots = featureShots();
    expect(shots).toHaveLength(5);
    for (const img of shots) {
      expect(img.getAttribute('src')).toMatch(/\/_next\/image\?url=/);
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute(
        'sizes',
        '(width < 62em) calc(100vw - 2rem), (width < 82.5em) calc((100vw - 2rem) * 7 / 12 - 3.5rem * 5 / 12), 45.5rem'
      );
    }
  });

  it('enlarges a screenshot in a dialog with a name, and a Close button that takes the focus', async () => {
    render(<Welcome />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Open enlarged screenshot:/ })[0]);
    expect(await screen.findByRole('dialog')).toHaveAccessibleName('Enlarged screenshot');
    // Mantine moves the focus in on a timer of its own.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  describe('the feature rows (Repo Trust and In action)', () => {
    let observed: { el: Element; fire: () => void }[];

    beforeEach(() => {
      observed = [];
      // jsdom has none, and without one nothing is ever armed. This one records
      // what each observer watches, so a test can say which part scrolled in.
      globalThis.IntersectionObserver = class {
        callback: IntersectionObserverCallback;
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }
        observe(el: Element) {
          observed.push({
            el,
            fire: () =>
              this.callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver
              ),
          });
        }
        disconnect() {}
      } as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
      delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
      jest.restoreAllMocks();
    });

    /** Where each element is at mount: `onScreen` decides, the rest is below the fold. */
    function placeAtMount(onScreen: (el: Element) => boolean) {
      // Laid out, not drawn: the hook reads offsets (`layoutBox`).
      jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
        this: HTMLElement
      ) {
        return onScreen(this) ? 100 : 5000;
      });
      jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
    }

    /** Each row's screenshot column and copy column, found from its screenshot. */
    function rows() {
      const images = featureShots();
      expect(images).toHaveLength(5);
      return images.map((img) => {
        const shot = img.closest('[data-reveal]') as HTMLElement;
        const copy = shot.parentElement?.querySelector(':scope > [data-reveal="rise"]');
        return { img, shot, copy };
      });
    }

    /** True while some scope at or above the element is armed and not yet revealed. */
    const held = (el: Element | null | undefined) =>
      el?.closest('[data-armed]:not([data-revealed])') != null;

    it('reveal the copy on its own way into view, not on the screenshot', () => {
      placeAtMount(() => false);
      render(<Welcome />);

      for (const { img, shot, copy } of rows()) {
        expect(held(shot)).toBe(true);
        expect(held(copy)).toBe(true);
        // The screenshot's top reaches the reveal line: the observer watching
        // the smallest scope round it fires. On a phone the copy is still under
        // the fold then (218-228px at 750px/s); as one reveal for the row, it
        // began to rise there.
        const around = observed.filter(({ el }) => el.contains(img));
        const watching = around.find((o) => !around.some((p) => p !== o && o.el.contains(p.el)));
        expect(watching).toBeDefined();
        act(() => watching?.fire());
        expect(held(shot)).toBe(false);
        expect(held(copy)).toBe(true);
      }
    });

    it('leave what was on screen at mount alone, and arm the part below the fold', () => {
      // A phone at mount, the fold between a row's screenshot and its copy.
      placeAtMount((el) => el.querySelector('img[src*="screenshot-feature"]') !== null);
      render(<Welcome />);

      for (const { shot, copy } of rows()) {
        expect(shot).not.toHaveAttribute('data-armed');
        expect(held(copy)).toBe(true);
      }
    });
  });
});
