import { appReleases, compileReleaseBodies, loadReleases } from './load-releases';
import type { Release } from './use-release-notes';

// The real compiler is ESM and needs a Node environment; what is under test is
// what happens AROUND it, so it is replaced. The default export stands in for
// the compile `loadReleases` uses when nothing is injected.
jest.mock(
  'nextra/compile',
  () => ({ compileMdx: jest.fn(async (body: string) => `compiled:${body}`) }),
  { virtual: true }
);

function release(tag: string, body: string | null, name = `FinderGit ${tag}`): Release {
  return {
    tag_name: tag,
    name,
    body,
    id: tag.length,
    created_at: '2026-09-18T10:00:00Z',
    published_at: '2026-09-18T10:00:00Z',
  } as unknown as Release;
}

function answer(status: number, json: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => json } as Response;
}

describe('compileReleaseBodies', () => {
  it('reads a release body as markdown, so a brace is never JavaScript', async () => {
    const compile = jest.fn(async () => 'compiled');
    await compileReleaseBodies([release('v1.0.0', 'hello')], compile as any);
    expect(compile).toHaveBeenCalledWith('hello', { mdxOptions: { format: 'md' } });
  });

  it('lets one uncompilable body cost only its own formatting', async () => {
    const compile = jest.fn(async (body: string) => {
      if (body.includes('{')) {
        throw new Error('Could not parse expression with acorn');
      }
      return `compiled:${body}`;
    });

    const out = await compileReleaseBodies(
      [release('v0.3.3', 'quoting { code = "-32600" } verbatim'), release('v0.3.2', 'fine')],
      compile as any
    );

    expect(out).toHaveLength(2);
    expect(out[0].body).toBeNull();
    expect(out[0].rawBody).toBe('quoting { code = "-32600" } verbatim');
    expect(out[1].body).toBe('compiled:fine');
  });
});

describe('appReleases', () => {
  it('keeps only FinderGit releases, as many as the page shows', () => {
    const out = appReleases([
      release('v0.39.0', 'a'),
      release('v6.4.0', 'template', 'v6.4.0'),
      release('v0.38.0', 'b'),
      release('v0.37.0', 'c'),
      release('v0.36.0', 'd'),
    ]);
    // displayCount is 3, and the template release must not take one of them.
    expect(out.map((r) => r.tag_name)).toEqual(['v0.39.0', 'v0.38.0', 'v0.37.0']);
  });

  it('answers an empty list to anything that is not a list', () => {
    // A rate-limited GitHub answers an object, not an array.
    expect(appReleases({ message: 'API rate limit exceeded' })).toEqual([]);
  });
});

describe('loadReleases', () => {
  const saved = process.env.GITHUB_TOKEN;
  afterEach(() => {
    process.env.GITHUB_TOKEN = saved;
  });

  it('returns the compiled releases the page renders', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = jest.fn(async () => answer(200, [release('v0.39.0', 'notes')]));
    const out = await loadReleases(fetchImpl as any);
    expect(out.map((r) => [r.tag_name, r.body])).toEqual([['v0.39.0', 'compiled:notes']]);
  });

  it('never throws, so the page can fall back to its runtime fetch', async () => {
    delete process.env.GITHUB_TOKEN;
    await expect(loadReleases((async () => answer(403, {})) as any)).resolves.toEqual([]);
    await expect(
      loadReleases((async () => {
        throw new Error('getaddrinfo ENOTFOUND api.github.com');
      }) as any)
    ).resolves.toEqual([]);
  });

  it('retries anonymously when the token is refused', async () => {
    process.env.GITHUB_TOKEN = 'expired';
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(answer(401, { message: 'Bad credentials' }))
      .mockResolvedValueOnce(answer(200, [release('v0.39.0', 'notes')]));
    const out = await loadReleases(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBeUndefined();
    expect(out).toHaveLength(1);
  });
});
