/**
 * @jest-environment node
 *
 * Route handlers build a real `Response`, which jsdom does not provide.
 */
import config from '@/config';
import { GET } from './route';

const PREFIX = config.releaseNotes.appReleaseNamePrefix;
const DMG = 'https://example.test/app-9.9.9.dmg';

/** A releases payload whose newest entry is an app release carrying a `.dmg`. */
function releasesWithDmg() {
  return [
    {
      name: `${PREFIX} 9.9.9`,
      tag_name: 'v9.9.9',
      assets: [{ name: 'App-9.9.9.dmg', browser_download_url: DMG }],
    },
  ];
}

function serve(body: unknown, ok = true) {
  return jest.fn(async () => ({
    ok,
    status: ok ? 200 : 503,
    headers: { get: () => null },
    json: async () => body,
    text: async () => '',
  })) as unknown as typeof global.fetch;
}

const originalFetch = global.fetch;
const originalToken = process.env.GITHUB_TOKEN;

beforeEach(() => {
  // The token branch takes a different path through the handler; pin the
  // anonymous one so these assertions are about caching and nothing else.
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = originalToken;
  }
  jest.restoreAllMocks();
});

describe('GET /download', () => {
  it('lets the CDN cache a resolved redirect', async () => {
    global.fetch = serve(releasesWithDmg());

    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control') ?? '';

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(DMG);
    // Vercel's CDN refuses to cache a response carrying `no-store`, and it
    // needs an `s-maxage` to cache one at all. Both halves are the fix: this
    // route used to answer `no-store`, so every crawler hit re-invoked the
    // function and re-read the releases payload out of the data cache.
    expect(cacheControl).not.toMatch(/no-store|no-cache|private/);
    expect(cacheControl).toMatch(/s-maxage=3600/);
  });

  it('caches a FALLBACK redirect for a short window only', async () => {
    global.fetch = serve(null, false);

    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control') ?? '';

    expect(response.headers.get('Location')).toBe(config.app.downloadUrl);
    // The discriminating case. Pinning a degraded answer for the resolved
    // lifetime would turn a blip at GitHub into an hour of every visitor
    // landing on the Releases page instead of on the download.
    expect(cacheControl).toMatch(/s-maxage=60\b/);
    expect(cacheControl).not.toMatch(/s-maxage=3600/);
  });

  it('asks GitHub for a short page rather than the feed-sized one', async () => {
    const fetchMock = serve(releasesWithDmg());
    global.fetch = fetchMock;

    await GET();

    // 75 KB at ten releases against 37 KB at five, measured on the live API.
    // Every invocation reads that payload back out of the data cache, so the
    // page size is billed on each one.
    expect(String((fetchMock as unknown as jest.Mock).mock.calls[0][0])).toContain('per_page=5');
  });

  it('skips a non-app release sitting on top of the list', async () => {
    global.fetch = serve([
      { name: 'v6.1.0', assets: [{ name: 'template.dmg', browser_download_url: 'https://no' }] },
      ...releasesWithDmg(),
    ]);

    const response = await GET();

    expect(response.headers.get('Location')).toBe(DMG);
  });
});
