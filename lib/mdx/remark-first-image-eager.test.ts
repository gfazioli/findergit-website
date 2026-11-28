import remarkFirstImageEager from './remark-first-image-eager.mjs';

const jsxImage = (src: string) => ({
  type: 'mdxJsxTextElement',
  name: 'img',
  children: [],
  attributes: [{ type: 'mdxJsxAttribute', name: 'src', value: src }],
});

function run(children: unknown[]) {
  const tree = { type: 'root', children } as any;
  remarkFirstImageEager()(tree);
  return tree;
}

const attributes = (node: any) =>
  Object.fromEntries(node.attributes.map((entry: any) => [entry.name, entry.value]));

describe('remarkFirstImageEager', () => {
  it('loads the first picture of the page at once, and leaves the others lazy', () => {
    const first = jsxImage('a');
    const second = jsxImage('b');
    run([
      { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Title' }] },
      { type: 'paragraph', children: [first] },
      { type: 'paragraph', children: [second] },
    ]);
    expect(attributes(first)).toEqual({ src: 'a', loading: 'eager', fetchPriority: 'high' });
    expect(attributes(second)).toEqual({ src: 'b' });
  });

  it('keeps what the page asked for itself', () => {
    const image = jsxImage('a');
    image.attributes.push({ type: 'mdxJsxAttribute', name: 'loading', value: 'lazy' });
    run([{ type: 'paragraph', children: [image] }]);
    expect(attributes(image)).toEqual({ src: 'a', loading: 'lazy', fetchPriority: 'high' });
  });

  it('touches nothing when the first picture is one the site does not hold', () => {
    const remote = { type: 'image', url: 'https://example.com/a.png', alt: '' };
    const later = jsxImage('b');
    run([{ type: 'paragraph', children: [remote, later] }]);
    expect(remote).toEqual({ type: 'image', url: 'https://example.com/a.png', alt: '' });
    expect(attributes(later)).toEqual({ src: 'b' });
  });

  it('does nothing on a page without pictures', () => {
    expect(() =>
      run([{ type: 'paragraph', children: [{ type: 'text', value: 'x' }] }])
    ).not.toThrow();
  });
});
