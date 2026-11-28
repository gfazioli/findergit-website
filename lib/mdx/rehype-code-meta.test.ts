import rehypeCodeMeta from './rehype-code-meta.mjs';

/** The hast MDX produces for ```` ```ts filename="a.ts" {2} ```` */
function codeBlock(meta?: string, className: string[] = ['language-ts']) {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className },
            data: meta ? { meta } : undefined,
            children: [{ type: 'text', value: 'const a = 1;' }],
          },
        ],
      },
    ],
  };
}

describe('rehype-code-meta', () => {
  it('copies the fence meta and the language onto the <pre>', () => {
    const tree = codeBlock('filename="a.ts" copy {2}');
    rehypeCodeMeta()(tree);
    expect(tree.children[0].properties).toEqual({
      dataMeta: 'filename="a.ts" copy {2}',
      dataLanguage: 'ts',
    });
  });

  it('leaves a block without meta or language alone', () => {
    const tree = codeBlock(undefined, []);
    rehypeCodeMeta()(tree);
    expect(tree.children[0].properties).toEqual({});
  });
});
