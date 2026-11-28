import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/**
 * Turns a Markdown image whose file the site holds into an import of that file, so the bundler
 * serves it (with its size, for `next/image`) the way Nextra's `remarkStaticImage` did:
 *
 * - next to the page, `![alt](./photo.png)`: without the import the URL stays `./photo.png`,
 *   which the browser resolves against the page's own route and nobody serves;
 * - in `public/`, `![alt](/shots/photo.png)`: Nextra imported these too, so a site moved over
 *   kept `next/image`'s sizes and formats on every picture. Left as a string it is a plain
 *   `<img>` of the full-size file. Only a path whose file is in `public/` is imported (decoded,
 *   so `/my%20shot.png` finds `my shot.png`); anything else, a route that serves an image
 *   included, stays as written.
 *
 * A relative path is touched with or without a `./` (`photo.png`, `images/photo.png`);
 * `https://…`, `//cdn…` and `data:…` URLs stay as they are. The image becomes
 * `<img src={importedImage} alt="…" />`, which `components/docs/MdxElements` renders with
 * `next/image`. A bare path is imported as `./path`: a bare import specifier would name a
 * package. A `public/` file is imported by its path from the page when the compiler names the
 * page (it does under `@next/mdx`), by its absolute path otherwise.
 *
 * `publicDir` (default: `public/` in the working directory, the project's root under `next`) is
 * an option for the tests. It is a plain module, with no dependency outside Node, because
 * Turbopack loads remark plugins by path.
 */
const IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
// Relative to the page: `./a.png`, `../a.png`, `a.png`, `images/a.png`. Not `https://…`, `//cdn…`,
// `data:…` (anything with a scheme), `/a.png` (absolute) or `#…`.
const isRelativeImage = (url) => IMAGE_FILE.test(url) && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url);
// From the site's root, served out of `public/`: `/a.png`, `/shots/a.png`. Not `//cdn…`.
const isRootImage = (url) => IMAGE_FILE.test(url) && /^\/(?!\/)/.test(url);

const toSpecifier = (url) => (url.startsWith('.') ? url : `./${url}`);

function decoded(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** The file in `public/` a root URL names, or undefined when there is none. */
function publicFile(url, publicDir) {
  const file = join(publicDir, decoded(url.slice(1)));
  // `join` resolves `..`: a URL that climbs out of `public/` names no file of it.
  return file.startsWith(publicDir + sep) && existsSync(file) ? file : undefined;
}

function specifierFor(file, pagePath) {
  if (!pagePath) {
    return file;
  }
  const path = relative(dirname(pagePath), file).split(sep).join('/');
  return path.startsWith('.') ? path : `./${path}`;
}

const identifier = (name) => ({ type: 'Identifier', name });

export default function remarkStaticImages(options = {}) {
  const publicDir = options.publicDir ?? join(process.cwd(), 'public');

  return (tree, file) => {
    const imports = [];
    const pagePath = file?.path;

    const importOf = (url) => {
      if (isRelativeImage(url)) {
        return toSpecifier(url);
      }
      const found = isRootImage(url) ? publicFile(url, publicDir) : undefined;
      return found ? specifierFor(found, pagePath) : undefined;
    };

    const walk = (node) => {
      if (!Array.isArray(node.children)) {
        return;
      }
      node.children = node.children.map((child) => {
        const specifier = child.type === 'image' ? importOf(child.url) : undefined;
        if (specifier) {
          const name = `__staticImage${imports.length}`;
          imports.push({ name, url: specifier });
          return {
            type: 'mdxJsxTextElement',
            name: 'img',
            children: [],
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'src',
                value: {
                  type: 'mdxJsxAttributeValueExpression',
                  value: name,
                  data: {
                    estree: {
                      type: 'Program',
                      sourceType: 'module',
                      body: [{ type: 'ExpressionStatement', expression: identifier(name) }],
                    },
                  },
                },
              },
              { type: 'mdxJsxAttribute', name: 'alt', value: child.alt ?? '' },
              ...(child.title
                ? [{ type: 'mdxJsxAttribute', name: 'title', value: child.title }]
                : []),
            ],
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);

    tree.children.unshift(
      ...imports.map(({ name, url }) => ({
        type: 'mdxjsEsm',
        value: `import ${name} from ${JSON.stringify(url)}`,
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [{ type: 'ImportDefaultSpecifier', local: identifier(name) }],
                source: { type: 'Literal', value: url, raw: JSON.stringify(url) },
                attributes: [],
              },
            ],
          },
        },
      }))
    );
  };
}
