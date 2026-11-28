import remarkHeadingIds from './remark-heading-ids.mjs';

// github-slugger is ESM only, which Jest cannot load: a stand-in with its rules for these inputs
// (lower case, drop punctuation, spaces to hyphens, -1/-2 for repeats). The real one is proved by
// the build, against the ids a site serves.
jest.mock('github-slugger', () => ({
  __esModule: true,
  default: class {
    seen = new Map<string, number>();
    slug(value: string) {
      const base = value
        .toLowerCase()
        .replace(/[^a-z0-9 _-]/g, '')
        .replace(/ /g, '-');
      const count = this.seen.get(base) ?? 0;
      this.seen.set(base, count + 1);
      return count ? `${base}-${count}` : base;
    }
  },
}));

const text = (value: string) => ({ type: 'text', value });
const heading = (...children: unknown[]) => ({ type: 'heading', depth: 2, children });

function ids(...headings: unknown[]) {
  const tree = { type: 'root', children: headings } as any;
  remarkHeadingIds()(tree);
  return tree.children.map((node: any) => node.data.hProperties.id);
}

describe('remarkHeadingIds', () => {
  it('slugs the text as written: -- stays two hyphens in the anchor, not an em dash', () => {
    expect(ids(heading(text('ASSEMBLY.H -- Main Include File')))).toEqual([
      'assemblyh----main-include-file',
    ]);
  });

  it('reads inline code and nested text', () => {
    expect(
      ids(
        heading(
          text('The '),
          { type: 'inlineCode', value: 'foo()' },
          { type: 'emphasis', children: [text(' bar')] }
        )
      )
    ).toEqual(['the-foo-bar']);
  });

  it('numbers repeated headings like rehype-slug', () => {
    expect(ids(heading(text('Usage')), heading(text('Usage')), heading(text('Usage')))).toEqual([
      'usage',
      'usage-1',
      'usage-2',
    ]);
  });
});
