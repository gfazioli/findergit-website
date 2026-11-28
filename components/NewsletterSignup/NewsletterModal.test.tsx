import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Profiler } from 'react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@/test-utils';
import { NewsletterModal } from './NewsletterModal';
import { NewsletterSignup } from './NewsletterSignup';
import { closedRecently, DISMISSED_KEY, PROMPT_OPEN_ATTRIBUTE } from './prompt-open';

/** The promise, written out here rather than read from the code it checks. */
// Written out, not read from `PROMPT_RETURNS_AFTER_MS`: a prompt back after a
// day, or after an hour, fails here.
const RETURNS = 12 * 60 * 60 * 1000;

// The page of the site, as the layout's navigations change it.
let mockPathname = '/';
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  usePathname: () => mockPathname,
}));

/**
 * A router, so Link handles a click as on the site rather than leaving it to
 * the browser. Jest loads the Pages Router's Link for `next/link` (the site's
 * bundler picks the App Router's, which needs React's server runtime to load):
 * both leave a modified click to the browser and call `onNavigate` for a plain
 * one, before they move.
 */
const router = {
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
  prefetch: jest.fn(() => Promise.resolve()),
};
const withRouter = (ui: React.ReactElement) => (
  <RouterContext.Provider value={router as never}>{ui}</RouterContext.Provider>
);

/*
 * The prompt watches the scroll on every page of the site, so what it costs
 * per scroll event is the point: it used to render on each one, forever.
 * Frames are queued by hand, so a test says exactly when the check runs.
 */
describe('NewsletterModal', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let jsdomScrollY: PropertyDescriptor | undefined;

  const runFrames = () =>
    act(() => {
      const due = [...frames.values()];
      frames.clear();
      due.forEach((callback) => callback(performance.now()));
    });

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  };

  const isOpen = () => document.documentElement.hasAttribute(PROMPT_OPEN_ATTRIBUTE);

  beforeEach(() => {
    mockPathname = '/';
    router.push.mockClear();
    localStorage.clear();
    frames = new Map();
    nextFrame = 1;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(nextFrame, callback);
      return nextFrame++;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    jsdomScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  afterEach(() => {
    // Unmounted while the doubles are still in place: its cleanup cancels a
    // frame the mock queued, which the real cancelAnimationFrame never issued.
    cleanup();
    jest.restoreAllMocks();
    window.history.replaceState(null, '', '/');
    if (jsdomScrollY) {
      Object.defineProperty(window, 'scrollY', jsdomScrollY);
    } else {
      delete (window as { scrollY?: number }).scrollY;
    }
  });

  it('opens once the page has scrolled past 1200px, and not before', () => {
    render(<NewsletterModal />);
    scrollTo(1000);
    runFrames();
    expect(isOpen()).toBe(false);

    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('is a dialog with a name of its own, and so is the button the focus lands on', async () => {
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('The FinderGit newsletter and Goodies');
    // Mantine moves the focus in on a timer of its own.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('reads the scroll at most once a frame', () => {
    render(<NewsletterModal />);
    runFrames();
    for (let y = 100; y <= 1000; y += 100) {
      scrollTo(y);
    }
    expect(frames.size).toBe(1);
  });

  it('stops watching the scroll once it has opened', () => {
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);

    // The open modal queues frames of its own; a scroll must add none.
    const queued = frames.size;
    scrollTo(2000);
    expect(frames.size).toBe(queued);
  });

  it('opens on a page that loads already past the trigger', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3000 });
    render(<NewsletterModal />);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('remembers when the visitor closed it', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('1800000000000');
  });

  it('stays closed for twelve hours after the visitor closed it', () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() - RETURNS + 60_000));
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('opens again once twelve hours have passed since the visitor closed it', () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() - RETURNS - 60_000));
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('opens for a visitor who closed it for good in an earlier version', () => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(true));
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('reads a closing time, a missing one, an old flag and a clock set back', () => {
    const now = 1_800_000_000_000;
    expect(closedRecently(String(now - 1000), now)).toBe(true);
    expect(closedRecently(String(now - RETURNS + 1), now)).toBe(true);
    expect(closedRecently(String(now - RETURNS), now)).toBe(false);
    expect(closedRecently(null, now)).toBe(false);
    expect(closedRecently('', now)).toBe(false);
    expect(closedRecently('true', now)).toBe(false);
    expect(closedRecently(String(now + 60_000), now)).toBe(false);
  });

  it('shows the Goodies above the newsletter, and closes as it goes to them', () => {
    render(withRouter(<NewsletterModal />));
    scrollTo(1300);
    runFrames();
    const goodies = screen.getByRole('link', { name: /See the Goodies/ });
    expect(goodies).toHaveAttribute('href', '/goodies');
    const subscribe = screen.getByRole('link', { name: /Subscribe for updates/ });
    // The promotion first: its button comes before the newsletter's.
    expect(goodies.compareDocumentPosition(subscribe)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'FinderGit Goodies',
      'Get release updates',
    ]);

    fireEvent.click(goodies);
    expect(router.push).toHaveBeenCalledWith('/goodies', expect.anything());
    expect(isOpen()).toBe(false);
    expect(closedRecently(localStorage.getItem(DISMISSED_KEY), Date.now())).toBe(true);
  });

  it('fills one button, the Goodies’, and leaves the newsletter’s plain under it', () => {
    render(withRouter(<NewsletterModal />));
    scrollTo(1300);
    runFrames();
    expect(screen.getByRole('link', { name: /See the Goodies/ })).not.toHaveAttribute(
      'data-variant'
    );
    expect(screen.getByRole('link', { name: /Subscribe for updates/ })).toHaveAttribute(
      'data-variant',
      'default'
    );
    // The pack's light is the dialog's own ground, behind a clear header.
    expect(screen.getByRole('dialog').getAttribute('style')).toContain('radial-gradient');
  });

  it('leaves the footer’s newsletter as it was, its button filled', () => {
    render(<NewsletterSignup />);
    expect(screen.getByRole('link', { name: /Subscribe for updates/ })).not.toHaveAttribute(
      'data-variant'
    );
    expect(screen.queryByRole('link', { name: /See the Goodies/ })).toBeNull();
  });

  it('gives the pictures to the pointer alone, as a second way to the shop', () => {
    render(withRouter(<NewsletterModal />));
    scrollTo(1300);
    runFrames();
    // One link by that name for a screen reader and the Tab key.
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'See the Goodies',
      'Subscribe for updates',
    ]);
    const pictures = screen
      .getByRole('dialog')
      .querySelector('a[aria-hidden="true"]') as HTMLAnchorElement;
    expect(pictures).toHaveAttribute('href', '/goodies');
    expect(pictures).toHaveAttribute('tabindex', '-1');
    expect(pictures.querySelectorAll('img')).toHaveLength(3);
    pictures.querySelectorAll('img').forEach((img) => expect(img).toHaveAttribute('alt', ''));

    fireEvent.click(pictures);
    expect(router.push).toHaveBeenCalledWith('/goodies', expect.anything());
    expect(isOpen()).toBe(false);
  });

  it('stays open when the Goodies open in a new tab', () => {
    render(withRouter(<NewsletterModal />));
    scrollTo(1300);
    runFrames();
    const goodies = screen.getByRole('link', { name: /See the Goodies/ });
    // The browser's new tab, which jsdom cannot open: cancelled on the
    // document, once React's handler on the root below it has seen the click
    // as it came.
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(goodies, { metaKey: true });
    expect(isOpen()).toBe(true);
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it('opens again, twelve hours after it was closed, in the tab it was closed in', () => {
    const { rerender } = render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(isOpen()).toBe(false);

    // The same tab, twelve hours on: a link to another page of the site.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + RETURNS);
    mockPathname = '/docs';
    rerender(<NewsletterModal />);
    scrollTo(0);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('opens on a later page of a tab left open since the visitor closed it', () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() - 60_000));
    const { rerender } = render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(false);

    // Twelve hours on, in the same tab: a link to another page of the site.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + RETURNS);
    mockPathname = '/docs';
    // The same tree as the first render: a different one would mount the
    // prompt anew and pass this without the recheck.
    rerender(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(true);
  });

  it('leaves the Goodies out on the shop’s own pages', () => {
    window.history.replaceState(null, '', '/goodies/licence');
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    const prompt = screen.getByRole('dialog');
    expect(prompt).toHaveAccessibleName('Subscribe to the FinderGit newsletter');
    expect(screen.queryByRole('link', { name: /See the Goodies/ })).toBeNull();
    // The newsletter alone, as the footer has it: its button filled, no
    // heading but its own, and nothing of the Goodies' left around it (their
    // light, the line under them, a link to the page behind the overlay).
    expect(screen.getByRole('link', { name: /Subscribe for updates/ })).not.toHaveAttribute(
      'data-variant'
    );
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Get release updates',
    ]);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(prompt.getAttribute('style') ?? '').not.toContain('radial-gradient');
    expect(prompt.querySelector('.mantine-Modal-body')?.children).toHaveLength(1);
  });

  it('opens at most once per page load, even where storage refuses the answer', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<NewsletterModal />);
    scrollTo(1300);
    runFrames();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(isOpen()).toBe(false);

    scrollTo(1600);
    runFrames();
    expect(isOpen()).toBe(false);
  });

  it('is the key the screenshot script writes to keep it out of its captures', () => {
    const shot = readFileSync(join(__dirname, '../../scripts/shot.mjs'), 'utf8');
    expect(shot).toContain(`const PROMPT_KEY = '${DISMISSED_KEY}';`);
    // A closing time, which the prompt reads as closed: a `true` no longer is.
    expect(shot).toContain(
      'localStorage.setItem(${JSON.stringify(PROMPT_KEY)}, String(Date.now()))'
    );
  });

  it('stays closed when the visitor closed it in another tab since the page loaded', () => {
    render(<NewsletterModal />);
    runFrames();
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    scrollTo(1300);
    runFrames();
    expect(isOpen()).toBe(false);
  });

  it('renders nothing for a scroll once the visitor has closed it', () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    let commits = 0;
    render(
      <Profiler id="prompt" onRender={() => commits++}>
        <NewsletterModal />
      </Profiler>
    );
    runFrames();
    commits = 0;

    for (let y = 100; y <= 3000; y += 100) {
      scrollTo(y);
    }
    // No watcher at all: a scroll queues no frame to read it in.
    expect(frames.size).toBe(0);
    runFrames();
    expect(commits).toBe(0);
    expect(isOpen()).toBe(false);
  });
});
