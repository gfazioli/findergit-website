import config from '@/config';
import { fetchReleaseCadence } from './fetch-release-cadence';

const NOW = new Date('2026-08-31T18:00:00Z');

/** One app release, dated `days` before NOW so the ordering is predictable. */
function release(n: number, days: number) {
  const at = new Date(NOW.getTime() - days * 86_400_000).toISOString();
  return { name: `FinderGit 0.${n}.0`, tag_name: `v0.${n}.0`, published_at: at };
}

/** Serves the given pages in order, then empty pages. */
function servePages(pages: unknown[][]) {
  let call = 0;
  return jest.fn(async () => {
    const body = pages[call] ?? [];
    call += 1;
    return { ok: true, json: async () => body } as unknown as Response;
  });
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('fetchReleaseCadence', () => {
  it('counts across pages when the last one is short', async () => {
    const full = Array.from({ length: 100 }, (_, i) => release(i + 100, i + 200));
    const tail = Array.from({ length: 7 }, (_, i) => release(i, i + 1));
    global.fetch = servePages([full, tail]);

    const cadence = await fetchReleaseCadence(NOW);
    expect(cadence.total).toBe(107);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('reports NO count when the paging cap is hit with a full page', async () => {
    // The discriminating case. Five full pages do not prove there is nothing
    // after them, so summarising them would publish 500 as a total when the
    // real number is 500-or-more. Before this was guarded the function returned
    // exactly that.
    const full = Array.from({ length: 100 }, (_, i) => release(i, i + 1));
    global.fetch = servePages([full, full, full, full, full]);

    const cadence = await fetchReleaseCadence(NOW);
    expect(cadence.total).toBeNull();
    expect(cadence.since).toBeNull();
    // Still a usable strip: the config date stands in.
    expect(cadence.latestDate).toContain('2026');
  });

  it('stops at the cap instead of walking the API forever', async () => {
    const full = Array.from({ length: 100 }, (_, i) => release(i, i + 1));
    global.fetch = servePages([full, full, full, full, full, full, full]);

    await fetchReleaseCadence(NOW);
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  it('falls back on a non-OK response rather than counting what arrived', async () => {
    const full = Array.from({ length: 100 }, (_, i) => release(i, i + 1));
    let call = 0;
    global.fetch = jest.fn(async () => {
      call += 1;
      return call === 1
        ? ({ ok: true, json: async () => full } as unknown as Response)
        : ({ ok: false, status: 403, json: async () => ({}) } as unknown as Response);
    });

    const cadence = await fetchReleaseCadence(NOW);
    expect(cadence.total).toBeNull();
  });

  it('falls back when the payload is not an array', async () => {
    global.fetch = jest.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({ message: 'rate limit exceeded' }),
        }) as unknown as Response
    );
    expect((await fetchReleaseCadence(NOW)).total).toBeNull();
  });

  it('falls back when the request throws', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('ETIMEDOUT');
    });
    expect((await fetchReleaseCadence(NOW)).total).toBeNull();
  });

  it('ignores the website template releases sharing the repo', async () => {
    global.fetch = servePages([
      [
        release(28, 0),
        { name: 'v6.0.7', tag_name: 'v6.0.7', published_at: NOW.toISOString() },
        release(27, 5),
      ],
    ]);
    const cadence = await fetchReleaseCadence(NOW);
    expect(cadence.total).toBe(2);
  });

  it('asks GitHub anonymously, so a draft can never be counted', async () => {
    const spy = servePages([[release(28, 0)]]);
    global.fetch = spy;
    await fetchReleaseCadence(NOW);
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.stringify(init.headers)).not.toMatch(/authorization/i);
  });

  it('reads the app releases of the configured repo', async () => {
    const spy = servePages([[release(28, 0)]]);
    global.fetch = spy;
    await fetchReleaseCadence(NOW);
    const [url] = spy.mock.calls[0] as unknown as [string];
    expect(url).toContain(config.gitHub.releasesUrl);
    expect(url).toContain('per_page=100');
  });
});
