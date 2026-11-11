import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { fireEvent, render, screen } from '@/test-utils';
import { Tutorial } from './Tutorial';
import { clock, isoDuration, TUTORIALS, twoDigits, type TutorialFilm } from './tutorials';

const ROOT = join(__dirname, '..', '..');

// Nextra ships ESM that Jest does not transform; the player takes only
// `docsSizes` from DocsImage, which does not need it.
jest.mock('nextra/components', () => ({ ImageZoom: () => null }), { virtual: true });

// A film of the tests' own, numbered as no film of the series is: the
// component is tested on it whichever films the registry lists.
const FILM: TutorialFilm = {
  n: 0,
  id: 'fgTutorial0',
  title: 'Add your repositories',
  summary: 'FinderGit starts empty. Add the folder where your projects live.',
  seconds: 62.2,
  published: '2026-11-12T17:00:00+01:00',
};

describe('Tutorial', () => {
  beforeAll(() => TUTORIALS.push(FILM));
  afterAll(() => TUTORIALS.splice(TUTORIALS.indexOf(FILM), 1));

  it('shows the poster as a link to the film, and loads nothing from YouTube', () => {
    const { container } = render(<Tutorial n={0} />);
    const link = screen.getByRole('link', {
      name: /Play FinderGit Tutorial 00: Add your repositories/,
    });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=fgTutorial0');
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });

  it('puts the player in its place on a click, playing, with the focus in it', () => {
    const { container } = render(<Tutorial n={0} />);
    fireEvent.click(screen.getByRole('link', { name: /Play FinderGit Tutorial 00/ }));
    const frame = container.querySelector('iframe')!;
    expect(frame.src).toBe(
      'https://www.youtube-nocookie.com/embed/fgTutorial0?autoplay=1&rel=0&enablejsapi=1&origin=http%3A%2F%2Flocalhost'
    );
    expect(frame.title).toBe('FinderGit Tutorial 00: Add your repositories (1:03)');
    expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    expect(document.activeElement).toBe(frame);
  });

  /** The player after a click, with what the page sends it and a way to answer. */
  function playing() {
    const { container } = render(<Tutorial n={0} />);
    fireEvent.click(screen.getByRole('link', { name: /Play FinderGit Tutorial 00/ }));
    const frame = container.querySelector('iframe')!;
    const post = jest.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => {});
    const sent = () => post.mock.calls.map(([m]) => JSON.parse(m as string));
    const hear = (data: object, source: Window | null = frame.contentWindow) =>
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data), source }));
      });
    const unloads = () => sent().filter((m) => m.func === 'unloadModule');
    return { sent, hear, unloads };
  }
  const PLAYS = { event: 'infoDelivery', info: { playerState: 1 } };
  const CAPTIONS = { event: 'apiInfoDelivery', info: { namespaces: ['captions'] } };
  const UNLOAD = {
    event: 'command',
    func: 'unloadModule',
    args: ['captions'],
    id: 1,
    channel: 'widget',
  };
  const later = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  describe('and its captions', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('knocks until the player answers, then stops', () => {
      const { sent, hear } = playing();
      later(600);
      const knocks = () => sent().filter((m) => m.event === 'listening').length;
      expect(knocks()).toBeGreaterThan(1);
      hear({ event: 'onReady', info: null });
      const answered = knocks();
      later(1000);
      expect(knocks()).toBe(answered);
    });

    it('unloads captions the player loaded before the film played, once it plays, once', () => {
      const { hear, unloads } = playing();
      hear(CAPTIONS);
      expect(unloads()).toEqual([]);
      hear({ event: 'infoDelivery', info: { playerState: 3 } });
      expect(unloads()).toEqual([]);
      hear(PLAYS);
      hear(PLAYS);
      hear(CAPTIONS);
      expect(unloads()).toEqual([UNLOAD]);
    });

    it('waits for a captions module that loads just after the film starts', () => {
      const { hear, unloads } = playing();
      hear(PLAYS);
      expect(unloads()).toEqual([]); // nothing to unload yet: it would do nothing
      later(1500);
      hear(CAPTIONS);
      expect(unloads()).toEqual([UNLOAD]);
    });

    it('leaves captions the viewer turns on later', () => {
      const { hear, unloads } = playing();
      hear(PLAYS);
      later(10_000);
      hear(CAPTIONS);
      expect(unloads()).toEqual([]);
    });

    it('listens to its own frame only', () => {
      const { hear, unloads } = playing();
      hear(CAPTIONS, window);
      hear(PLAYS, window);
      expect(unloads()).toEqual([]);
    });
  });

  it('lets a click with a modifier open YouTube, as the reader asked', () => {
    const { container } = render(<Tutorial n={0} />);
    const link = screen.getByRole('link', { name: /Play FinderGit Tutorial 00/ });
    const notCancelled = fireEvent.click(link, { metaKey: true });
    expect(notCancelled).toBe(true);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('describes the film for search in the served markup', () => {
    const { container } = render(<Tutorial n={0} />);
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!
    );
    expect(json).toMatchObject({
      '@type': 'VideoObject',
      name: 'Add your repositories | FinderGit Tutorial 00',
      thumbnailUrl: 'https://findergit.app/tutorials/findergit-tutorial-00.jpg',
      uploadDate: '2026-11-12T17:00:00+01:00',
      duration: 'PT1M2S',
      embedUrl: 'https://www.youtube-nocookie.com/embed/fgTutorial0',
      publisher: { '@id': 'https://findergit.app/#organization' },
    });
    expect(container.querySelector('figcaption')!.textContent).toBe(
      'FinderGit Tutorial 00 · Add your repositories · 1:03 · All the tutorials'
    );
  });

  it('refuses a number with no film', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tutorial n={11} />)).toThrow('No FinderGit tutorial numbered 11');
  });
});

describe('the series', () => {
  it('lists each film once, in order, each with its poster', () => {
    const numbers = TUTORIALS.map((t) => t.n);
    expect([...new Set(numbers)].sort((a, b) => a - b)).toEqual(numbers);
    expect(new Set(TUTORIALS.map((t) => t.id)).size).toBe(TUTORIALS.length);
    for (const t of TUTORIALS) {
      expect(
        existsSync(join(ROOT, 'public', 'tutorials', `findergit-tutorial-${twoDigits(t.n)}.jpg`))
      ).toBe(true);
    }
  });

  it('goes out on dates a browser can read', () => {
    expect(TUTORIALS.every((t) => Number.isFinite(Date.parse(t.published)))).toBe(true);
  });

  it('writes a length the way YouTube and schema.org do', () => {
    expect(clock(63.4)).toBe('1:04');
    expect(clock(62.2)).toBe('1:03');
    expect(clock(71.0)).toBe('1:11');
    expect(isoDuration(63.4)).toBe('PT1M3S');
  });
});

/** Every `<Tutorial n={N} />` in a page's source. */
const embedsIn = (source: string) =>
  [...source.matchAll(/<Tutorial\s+n=\{\s*(\d+)\s*\}/g)].map((m) => Number(m[1]));

/** Every page of the docs, from the site's root. */
function docsPages(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (name.endsWith('.mdx')) {
        found.push(path.slice(ROOT.length + 1));
      }
    }
  };
  walk(join(ROOT, 'content'));
  return found;
}

// A film is private until it goes out, and an embed of it says "Video
// unavailable": a page takes a film on the day it is published, not before.
describe('the docs', () => {
  const pages = docsPages();
  const embeds = pages.flatMap((page) =>
    embedsIn(readFileSync(join(ROOT, page), 'utf8')).map((n) => ({ n, page }))
  );

  // No page has a film yet, so the net is proved on its own two halves.
  it('are read by a net that reaches the pages and finds an embed', () => {
    expect(pages).toContain(join('content', 'getting-started.mdx'));
    expect(
      embedsIn('Intro.\n\n<Tutorial n={4} />\n\n## Next\n<Tutorial  n={10}/>\n<Tutorial n={ 7 } />')
    ).toEqual([4, 10, 7]);
  });

  it('embed a film only once it is listed and public', () => {
    for (const { n, page } of embeds) {
      const published = TUTORIALS.find((t) => t.n === n)?.published;
      expect({ page, n, isPublic: Date.parse(published ?? '') <= Date.now() }).toEqual({
        page,
        n,
        isPublic: true,
      });
    }
  });

  it('embed each film once', () => {
    const numbers = embeds.map((e) => e.n);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
