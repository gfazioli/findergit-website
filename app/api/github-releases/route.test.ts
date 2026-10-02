/**
 * @jest-environment node
 */
import { GET } from './route';

// What the route answers when GitHub refuses. The page reads a rate limit off the
// status alone, so the route is where a spent quota is told apart from GitHub's other
// 403s and from the route's own bot filter (#68, review).

function github(status: number, headers: Record<string, string> = {}): Response {
  return new Response('{"message":"refused"}', { status, headers });
}

function visit(userAgent = 'Mozilla/5.0 (Macintosh)') {
  return new Request('https://example.test/api/github-releases', {
    headers: { 'user-agent': userAgent },
  });
}

const fetchMock = jest.fn();

beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/github-releases, when GitHub refuses', () => {
  it('sends a spent quota on as a 429', async () => {
    fetchMock.mockResolvedValue(github(403, { 'x-ratelimit-remaining': '0' }));
    expect((await GET(visit())).status).toBe(429);
  });

  it("keeps GitHub's own 429", async () => {
    fetchMock.mockResolvedValue(github(429));
    expect((await GET(visit())).status).toBe(429);
  });

  it('keeps a 403 that is not about the quota', async () => {
    fetchMock.mockResolvedValue(github(403, { 'x-ratelimit-remaining': '42' }));
    expect((await GET(visit())).status).toBe(403);
  });

  // "Cubot" phones carry "bot" in their user agent: a reader, refused, must not be
  // told to wait for a quota.
  it('refuses its own bots with a 403, never a 429', async () => {
    expect((await GET(visit('Mozilla/5.0 (Linux; Android 12; CUBOT X50)'))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
