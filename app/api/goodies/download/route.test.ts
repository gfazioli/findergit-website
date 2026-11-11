/**
 * @jest-environment node
 *
 * Route handlers build a real `Response`, which jsdom does not provide.
 */
import { recordDownload } from '../../../../lib/goodies-events';
import { GET } from './route';

jest.mock('../../../../lib/goodies-events', () => ({ recordDownload: jest.fn() }));
const recorded = jest.mocked(recordDownload);

const ENV = {
  GOODIES_PAYMENT_LINK_URL: 'https://buy.example.test/goodies',
  GOODIES_PAYMENT_LINK_ID: 'plink_goodies',
  GOODIES_RELEASES_REPO: 'owner/goodies',
  GOODIES_GITHUB_TOKEN: 'github-token',
  STRIPE_SECRET_KEY: 'rk_test_key',
};
const SIGNED = 'https://files.example.test/pack?sig=abc';
const request = (query: string) =>
  new Request(`https://findergit.test/api/goodies/download${query}`);

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

/** Stripe answers with `session`; GitHub with the pack's two assets and their redirects. */
function serve(session: unknown) {
  const fetchMock = jest.fn(async (url: string) => {
    if (url.startsWith('https://api.stripe.com/')) {
      return new Response(JSON.stringify(session), { status: 200 });
    }
    if (url.endsWith('/releases/latest')) {
      return new Response(
        JSON.stringify({
          tag_name: 'v0.2.1',
          assets: [
            { id: 7, name: 'pack.dmg' },
            { id: 8, name: 'pictures.zip' },
          ],
        }),
        { status: 200 }
      );
    }
    return new Response(null, {
      status: 302,
      headers: { location: `${SIGNED}&asset=${url.split('/').pop()}` },
    });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  Object.assign(process.env, ENV);
  recorded.mockClear();
});

afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

describe('GET /api/goodies/download', () => {
  const paid = { status: 'complete', payment_status: 'paid', payment_link: 'plink_goodies' };

  it('redirects a paid session to the signed URL, never cached, with no referrer', async () => {
    serve(paid);

    const response = await GET(request('?session_id=cs_test_abc'));

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(`${SIGNED}&asset=7`);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  });

  it('counts each file handed out, with its release and kind, and nothing it refuses', async () => {
    serve(paid);

    await GET(request('?session_id=cs_test_abc'));
    await GET(request('?session_id=cs_test_abc&kind=pictures'));
    expect(recorded.mock.calls.map((c) => c.slice(1))).toEqual([
      ['cs_test_abc', 'v0.2.1', 'mac'],
      ['cs_test_abc', 'v0.2.1', 'pictures'],
    ]);

    recorded.mockClear();
    serve({ ...paid, payment_status: 'unpaid' });
    await GET(request('?session_id=cs_test_abc'));
    await GET(request('?session_id=cs_test_abc&kind=../x'));
    expect(recorded).not.toHaveBeenCalled();
  });

  it('serves the pictures ZIP when asked, and refuses a kind it does not know', async () => {
    const fetchMock = serve(paid);

    const zip = await GET(request('?session_id=cs_test_abc&kind=pictures'));
    expect(zip.status).toBe(302);
    expect(zip.headers.get('Location')).toBe(`${SIGNED}&asset=8`);

    fetchMock.mockClear();
    expect((await GET(request('?session_id=cs_test_abc&kind=../x'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a session paid through another link', async () => {
    serve({ ...paid, payment_link: 'plink_coffee' });

    const response = await GET(request('?session_id=cs_test_abc'));

    expect(response.status).toBe(403);
    expect(response.headers.get('Location')).toBeNull();
  });

  it('refuses a request without a session id', async () => {
    serve(paid);

    expect((await GET(request(''))).status).toBe(403);
  });

  it('does not exist where the shop is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    serve(paid);

    expect((await GET(request('?session_id=cs_test_abc'))).status).toBe(404);
  });
});
