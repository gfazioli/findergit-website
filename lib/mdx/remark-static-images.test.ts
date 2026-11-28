import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import remarkStaticImages from './remark-static-images.mjs';

const image = (url: string, alt = 'A photo', title?: string) => ({
  type: 'image',
  url,
  alt,
  title,
});

function transform(children: unknown[], options?: { publicDir: string }, file?: { path: string }) {
  const tree = {
    type: 'root',
    children: [
      { type: 'paragraph', children },
      { type: 'paragraph', children: [] },
    ],
  } as any;
  remarkStaticImages(options)(tree, file);
  return tree;
}

describe('remarkStaticImages', () => {
  it('turns a relative image into an import and an <img src={import}>', () => {
    const tree = transform([image('./photo.png', 'A photo', 'Caption')]);

    const [esm] = tree.children;
    expect(esm.type).toBe('mdxjsEsm');
    expect(esm.value).toBe('import __staticImage0 from "./photo.png"');
    expect(esm.data.estree.body[0].source.value).toBe('./photo.png');

    const img = tree.children[1].children[0];
    expect(img.type).toBe('mdxJsxTextElement');
    expect(img.name).toBe('img');
    const [src, alt, title] = img.attributes;
    expect(src.value.value).toBe('__staticImage0');
    expect(src.value.data.estree.body[0].expression.name).toBe('__staticImage0');
    expect([alt.value, title.value]).toEqual(['A photo', 'Caption']);
  });

  it('numbers each image and follows ../ paths', () => {
    const tree = transform([image('./a.jpg'), image('../b.webp')]);
    expect(tree.children.slice(0, 2).map((node: any) => node.value)).toEqual([
      'import __staticImage0 from "./a.jpg"',
      'import __staticImage1 from "../b.webp"',
    ]);
  });

  it('imports a path with no ./ as ./path, never as a bare package specifier', () => {
    const tree = transform([image('photo.png'), image('images/photo.jpg')]);
    expect(tree.children.slice(0, 2).map((node: any) => node.value)).toEqual([
      'import __staticImage0 from "./photo.png"',
      'import __staticImage1 from "./images/photo.jpg"',
    ]);
  });

  it('leaves remote, unserved absolute and non-image URLs alone', () => {
    const tree = transform([
      image('https://example.com/a.png'),
      image('//cdn.example.com/a.png'),
      image('data:image/png;base64,AAAA'),
      image('/public/a.png'),
      image('./notes.pdf'),
    ]);
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0].children.every((node: any) => node.type === 'image')).toBe(true);
  });

  describe('an image served from public/', () => {
    let root: string;
    let publicDir: string;

    beforeAll(() => {
      root = mkdtempSync(join(tmpdir(), 'remark-static-images-'));
      publicDir = join(root, 'public');
      mkdirSync(join(publicDir, 'shots'), { recursive: true });
      writeFileSync(join(publicDir, 'shots', 'a.png'), '');
      writeFileSync(join(publicDir, 'my shot.png'), '');
      writeFileSync(join(root, 'secret.png'), '');
      writeFileSync(join(publicDir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
      mkdirSync(join(publicDir, 'folder.png'));
      symlinkSync(join(root, 'secret.png'), join(publicDir, 'linked.png'));
    });

    afterAll(() => rmSync(root, { recursive: true, force: true }));

    const values = (tree: any) =>
      tree.children.filter((node: any) => node.type === 'mdxjsEsm').map((node: any) => node.value);

    it('is imported by its path from the page, as Nextra did', () => {
      const page = { path: join(root, 'content', 'guides', 'intro.mdx') };
      const tree = transform([image('/shots/a.png')], { publicDir }, page);
      expect(values(tree)).toEqual(['import __staticImage0 from "../../public/shots/a.png"']);
      expect(tree.children[1].children[0].name).toBe('img');
    });

    it('is imported by its absolute path when the compiler names no page', () => {
      const tree = transform([image('/shots/a.png')], { publicDir });
      expect(values(tree)).toEqual([
        `import __staticImage0 from ${JSON.stringify(join(publicDir, 'shots', 'a.png'))}`,
      ]);
    });

    it('finds a file whose name the URL encodes', () => {
      const page = { path: join(root, 'content', 'index.mdx') };
      const tree = transform([image('/my%20shot.png')], { publicDir }, page);
      expect(values(tree)).toEqual(['import __staticImage0 from "../public/my shot.png"']);
    });

    it('imports the file of a URL with a query or a hash, without them', () => {
      const page = { path: join(root, 'content', 'index.mdx') };
      const tree = transform(
        [image('/shots/a.png?v=2'), image('/shots/a.png#top')],
        { publicDir },
        page
      );
      expect(values(tree)).toEqual([
        'import __staticImage0 from "../public/shots/a.png"',
        'import __staticImage1 from "../public/shots/a.png"',
      ]);
    });

    it('leaves an SVG, a folder, a link out of public/ and an encoded separator as written', () => {
      const page = { path: join(root, 'content', 'index.mdx') };
      const tree = transform(
        [
          image('/logo.svg'),
          image('/folder.png'),
          image('/linked.png'),
          image('/shots%2Fa.png'),
          image('/shots%5Ca.png'),
          image('/shots%3Fa.png'),
          image('/../public/shots/a.png'),
        ],
        { publicDir },
        page
      );
      expect(values(tree)).toEqual([]);
    });

    it('stays as written when public/ holds no such file, or the path climbs out of it', () => {
      const page = { path: join(root, 'content', 'index.mdx') };
      const tree = transform(
        [image('/shots/missing.png'), image('/../secret.png'), image('//cdn.example.com/a.png')],
        { publicDir },
        page
      );
      expect(values(tree)).toEqual([]);
      expect(tree.children[0].children.every((node: any) => node.type === 'image')).toBe(true);
    });
  });
});
