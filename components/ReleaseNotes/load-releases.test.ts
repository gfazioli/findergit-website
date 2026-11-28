import { appReleases, compileMarkdown, compileReleaseBodies, loadReleases } from './load-releases';
import type { Release } from './use-release-notes';

// github-slugger ships ESM only, which Jest does not transform. Its algorithm is
// its own business (the engine and Nextra slug headings with it too); what is
// under test is that every heading gets one, counted per body. This stand-in
// slugs as GitHub does for plain words.
jest.mock(
  'github-slugger',
  () =>
    class {
      private seen = new Map<string, number>();

      slug(text: string) {
        const base = text.toLowerCase().trim().replace(/\s+/g, '-');
        const count = this.seen.get(base) ?? 0;
        this.seen.set(base, count + 1);
        return count ? `${base}-${count}` : base;
      }
    }
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

describe('compileMarkdown', () => {
  it('reads a body as markdown, so a brace is text and never JavaScript', () => {
    expect(compileMarkdown('quoting `{ code = "-32600" }` and { braces } verbatim')).toBe(
      '<p>quoting <code>{ code = &quot;-32600&quot; }</code> and { braces } verbatim</p>\n'
    );
  });

  it('gives every heading its GitHub slug, counted per body, as Nextra did', () => {
    const html = compileMarkdown('## Highlights\n\n### Verify this download\n\n## Highlights');
    expect(html).toContain('<h2 id="highlights">Highlights</h2>');
    expect(html).toContain('<h3 id="verify-this-download">Verify this download</h3>');
    expect(html).toContain('<h2 id="highlights-1">Highlights</h2>');
    // A new body starts counting again: each release has its own `#highlights`.
    expect(compileMarkdown('## Highlights')).toContain('<h2 id="highlights">');
  });

  it('puts a copy button after every code block, the block left as marked writes it', () => {
    const html = compileMarkdown('```sh\nshasum -a 256 FinderGit.dmg\n```');
    expect(html).toBe(
      '<div class="release-code"><pre><code class="language-sh">shasum -a 256 FinderGit.dmg\n</code></pre>\n<button type="button" data-release-copy>Copy</button></div>\n'
    );
  });
});

describe('compileReleaseBodies', () => {
  it('lets one uncompilable body cost only its own formatting', () => {
    const compile = jest.fn((body: string) => {
      if (body.includes('{')) {
        throw new Error('Could not parse expression with acorn');
      }
      return `compiled:${body}`;
    });

    const out = compileReleaseBodies(
      [release('v0.3.3', 'quoting { code = "-32600" } verbatim'), release('v0.3.2', 'fine')],
      compile
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
    expect(out.map((r) => [r.tag_name, r.body])).toEqual([['v0.39.0', '<p>notes</p>\n']]);
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
