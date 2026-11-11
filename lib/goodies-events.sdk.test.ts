/**
 * @jest-environment node
 *
 * The real `@vercel/analytics/server`, not a mock: what it posts is the point.
 * Vercel's runtime hands `track` a request context whose `url` it prefers to
 * the referer we pass, and on the download route that URL carries the session
 * id. These tests stand in for that context and read the payload `track` posts.
 */
import { recordDownload } from './goodies-events';

// Jest resolves the package's `node` condition to its ES module, which it cannot load: the
// CommonJS build beside it is the same code (`require` condition).
jest.mock('@vercel/analytics/server', () =>
  jest.requireActual('../node_modules/@vercel/analytics/dist/server/index.js')
);

const SYMBOL = Symbol.for('@vercel/request-context');
const SESSION = 'cs_live_a1B2c3D4';
const URL_WITH_KEY = `https://findergit.test/api/goodies/download?session_id=${SESSION}&kind=mac`;
const request = () =>
  new Request(URL_WITH_KEY, {
    headers: { 'user-agent': 'Safari', 'x-forwarded-for': '203.0.113.7' },
  });

const originalFetch = global.fetch;
const originalEndpoint = process.env.VERCEL_URL;
let posted: { url: string; body: Record<string, unknown> }[];
let waited: Promise<unknown>[];

beforeEach(() => {
  posted = [];
  waited = [];
  process.env.VERCEL_URL = 'findergit-website-abc.vercel.app';
  global.fetch = jest.fn(async (url: string, init: RequestInit) => {
    posted.push({ url, body: JSON.parse(String(init.body)) });
    return new Response('ok');
  }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.VERCEL_URL = originalEndpoint;
  delete (globalThis as Record<symbol, unknown>)[SYMBOL];
});

function runtimeContext(extra: Record<string, unknown> = {}) {
  const context = {
    url: URL_WITH_KEY,
    headers: { referer: URL_WITH_KEY },
    waitUntil: (promise: Promise<unknown>) => waited.push(promise),
    ...extra,
  };
  const holder = { get: () => context };
  (globalThis as Record<symbol, unknown>)[SYMBOL] = holder;
  return holder;
}

describe('the event track() actually posts', () => {
  it('names a page without the key, though the runtime context carries the URL that has it', async () => {
    const holder = runtimeContext();
    const before = holder.get;

    await recordDownload(request(), SESSION, 'v0.2.1', 'mac');
    await Promise.all(waited);

    expect(posted).toHaveLength(1);
    expect(posted[0].url).toBe('https://findergit.test/_vercel/insights/event');
    expect(posted[0].body.o).toBe('https://findergit.test/goodies/thanks');
    expect(posted[0].body.en).toBe('Goodies download');
    expect(JSON.stringify(posted)).not.toContain(SESSION);
    // the runtime keeps its own context, and the post still went through its waitUntil
    expect(holder.get).toBe(before);
    expect(holder.get().url).toBe(URL_WITH_KEY);
    expect(waited).toHaveLength(1);
  });

  it('sends nothing when the context cannot be swapped', async () => {
    Object.freeze(runtimeContext());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await recordDownload(request(), SESSION, 'v0.2.1', 'mac');

    expect(posted).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('sends with our referer where the runtime gives no context at all', async () => {
    await recordDownload(request(), SESSION, 'v0.2.1', 'pictures');

    expect(posted).toHaveLength(1);
    expect(posted[0].body.o).toBe('https://findergit.test/goodies/thanks');
  });
});
