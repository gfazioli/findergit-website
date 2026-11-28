import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cache } from 'react';
import { parsePageSource, titleFromName } from './page-source';
import { toRoute } from './routes';
import type { DocsData, DocsNode, DocsPage, MetaEntry, MetaRecord, PageTheme } from './types';

/**
 * The docs engine's file system side: it reads `content/`, the same layout Nextra uses, and
 * turns it into the sidebar tree and the list of pages.
 *
 * - every `.mdx` file is a page, served at `/docs/<path>` (`index` at its folder's path);
 * - a `_meta` file orders a folder and names its entries, in Nextra's format: a string title, or
 *   an object with `title`, `display: 'hidden'`, `type: 'separator'`, an external `href`, `theme`;
 * - an entry missing from `_meta` follows the listed ones, alphabetically;
 * - a title left empty (`markdown: ''`) comes from the page itself: its front matter `title`,
 *   otherwise its first `# heading`, otherwise its file name.
 *
 * Runs on the server, at build time: every docs route is prerendered.
 */

const CONTENT_DIR = join(process.cwd(), 'content');
const PAGE_FILE = /\.mdx$/;
const META_FILE = /^_meta\.(ts|tsx|js|jsx)$/;

/**
 * `_meta` files are modules (they may hold JSX titles), so they are imported, not parsed. The
 * import names the real file, extension included: Turbopack builds the set of modules a dynamic
 * import may load from its pattern, and `@/content/${dir}_meta` (no extension) matched none.
 */
async function loadMeta(dir: string, names: string[]): Promise<MetaRecord> {
  const file = names.find((name) => META_FILE.test(name));
  if (!file) {
    return {};
  }
  const module = await import(`@/content/${dir}${file}`);
  return (module.default ?? {}) as MetaRecord;
}

function readPageSource(file: string) {
  return parsePageSource(readFileSync(join(CONTENT_DIR, file), 'utf8'));
}

function textOf(title: React.ReactNode): string | undefined {
  return typeof title === 'string' || typeof title === 'number' ? String(title) : undefined;
}

interface FolderItem {
  name: string;
  kind: 'page' | 'folder';
  file?: string;
}

async function readFolder(
  dir: string,
  slug: string[],
  parents: DocsPage['parents'],
  pages: DocsPage[]
): Promise<DocsNode[]> {
  const entries = readdirSync(join(CONTENT_DIR, dir), { withFileTypes: true });
  const meta = await loadMeta(
    dir,
    entries.map((entry) => entry.name)
  );

  const items = new Map<string, FolderItem>();
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
      continue;
    }
    if (entry.isDirectory()) {
      items.set(entry.name, { name: entry.name, kind: 'folder' });
    } else if (PAGE_FILE.test(entry.name)) {
      const name = entry.name.replace(PAGE_FILE, '');
      items.set(name, { name, kind: 'page', file: `${dir}${entry.name}` });
    }
  }

  const listed = Object.keys(meta);
  const unlisted = [...items.keys()].filter((name) => !(name in meta)).sort();
  const nodes: DocsNode[] = [];

  for (const key of [...listed, ...unlisted]) {
    const entry: MetaEntry = meta[key] ?? '';
    const options = typeof entry === 'string' ? {} : entry;
    const metaTitle = typeof entry === 'string' ? entry || undefined : entry.title;
    const item = items.get(key);

    if (options.type === 'separator') {
      nodes.push({ kind: 'separator', key, title: metaTitle });
      continue;
    }
    if (!item) {
      if (options.href) {
        nodes.push({
          kind: 'link',
          key,
          title: metaTitle ?? titleFromName(key),
          href: options.href,
          newWindow: options.newWindow ?? /^https?:/.test(options.href),
        });
      }
      continue;
    }

    const hidden = options.display === 'hidden';
    const theme: PageTheme = options.theme ?? {};

    if (item.kind === 'page') {
      const source = readPageSource(item.file!);
      const pageSlug = key === 'index' ? slug : [...slug, key];
      const fallback = source.title ?? source.heading ?? titleFromName(key);
      const sidebarTitle = metaTitle ?? source.sidebarTitle ?? fallback;
      const page: DocsPage = {
        route: toRoute(pageSlug),
        slug: pageSlug,
        file: item.file!,
        title: source.title ?? source.heading ?? textOf(metaTitle) ?? titleFromName(key),
        theme,
        hidden,
        parents,
      };
      pages.push(page);
      if (!hidden) {
        nodes.push({ kind: 'page', key, title: sidebarTitle, route: page.route });
      }
      continue;
    }

    const folderTitle = metaTitle ?? titleFromName(key);
    const folderSlug = [...slug, key];
    const children = await readFolder(
      `${dir}${key}/`,
      folderSlug,
      [...parents, { title: textOf(folderTitle) ?? titleFromName(key) }],
      pages
    );
    if (!hidden && children.length > 0) {
      nodes.push({
        kind: 'folder',
        key,
        title: folderTitle,
        route: toRoute(folderSlug),
        children,
      });
    }
  }

  return nodes;
}

/**
 * The whole docs: the sidebar tree and every page. Cached per request; a build renders each
 * route in its own request, so `next dev` picks up a new page without a restart.
 */
export const getDocs = cache(async (): Promise<DocsData> => {
  const pages: DocsPage[] = [];
  const tree = existsSync(CONTENT_DIR) ? await readFolder('', [], [], pages) : [];
  return { tree, pages };
});

export async function getPage(slug: string[]): Promise<DocsPage | undefined> {
  const route = toRoute(slug);
  return (await getDocs()).pages.find((page) => page.route === route);
}

/**
 * The pages before and after this one, in sidebar order: hidden pages are out of the sidebar, so
 * they are never a neighbour. (`theme.pagination: false` only hides the links on its own page.)
 */
export async function getNeighbours(page: DocsPage) {
  const order: string[] = [];
  const collect = (nodes: DocsNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'page') {
        order.push(node.route);
      } else if (node.kind === 'folder') {
        collect(node.children);
      }
    }
  };
  const { tree, pages } = await getDocs();
  collect(tree);

  const byRoute = new Map(pages.map((entry) => [entry.route, entry]));
  const list = order.map((route) => byRoute.get(route)!);
  const index = list.findIndex((entry) => entry.route === page.route);

  return {
    previous: index > 0 ? list[index - 1] : undefined,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : undefined,
  };
}

/** The MDX module of a page: its component, `frontmatter` and, if it exports one, `metadata`. */
export async function loadPageModule(page: DocsPage): Promise<{
  default: React.ComponentType;
  frontmatter?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}> {
  return import(`@/content/${page.file.slice(0, -'.mdx'.length)}.mdx`);
}
