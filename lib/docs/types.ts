import type { ReactNode } from 'react';

/**
 * Per-page layout switches, set with `theme` in a `_meta` file, as in Nextra:
 * `versioning: { theme: { toc: false } }`.
 */
export interface PageTheme {
  /** Table of contents in the right column @default true */
  toc?: boolean;
  /** Previous and next links under the page @default true */
  pagination?: boolean;
  /** Breadcrumbs above a nested page @default true */
  breadcrumb?: boolean;
  /** `full` drops the table of contents and lets the page use the whole width @default 'default' */
  layout?: 'default' | 'full';
}

/** One entry of a `_meta` file, in Nextra's format. */
export type MetaEntry =
  | string
  | {
      title?: ReactNode;
      type?: 'doc' | 'page' | 'menu' | 'separator';
      display?: 'normal' | 'hidden' | 'children';
      href?: string;
      newWindow?: boolean;
      theme?: PageTheme;
      items?: Record<string, { title?: ReactNode; href?: string; newWindow?: boolean }>;
    };

export type MetaRecord = Record<string, MetaEntry>;

/** A node of the sidebar tree. */
export type DocsNode = DocsPageNode | DocsFolderNode | DocsSeparatorNode | DocsLinkNode;

export interface DocsPageNode {
  kind: 'page';
  key: string;
  title: ReactNode;
  route: string;
}

export interface DocsFolderNode {
  kind: 'folder';
  key: string;
  title: ReactNode;
  /** The folder's route: the route of its `index` page, when it has one */
  route: string;
  children: DocsNode[];
}

export interface DocsSeparatorNode {
  kind: 'separator';
  key: string;
  title?: ReactNode;
}

export interface DocsLinkNode {
  kind: 'link';
  key: string;
  title: ReactNode;
  href: string;
  newWindow: boolean;
}

/** Everything a route needs to render its page, its metadata and its neighbours. */
export interface DocsPage {
  route: string;
  slug: string[];
  /** Path of the MDX file, relative to `content/` */
  file: string;
  /** Plain-text title, for `<title>`, breadcrumbs and the previous / next links */
  title: string;
  theme: PageTheme;
  /** Listed in `_meta` with `display: 'hidden'`: served, but out of the sidebar and the pagination */
  hidden: boolean;
  /** The folders above the page, outermost first */
  parents: { title: string; route?: string }[];
}

export interface DocsData {
  tree: DocsNode[];
  pages: DocsPage[];
}

/** A header link, from `app/_meta.tsx` */
export interface TopNavItem {
  key: string;
  title: ReactNode;
  href: string;
  newWindow: boolean;
}

/** A header dropdown (`type: 'menu'`), from `app/_meta.tsx` */
export interface TopNavMenu {
  key: string;
  title: ReactNode;
  items: TopNavItem[];
}

export type TopNavEntry = TopNavItem | TopNavMenu;

export function isMenu(entry: TopNavEntry): entry is TopNavMenu {
  return 'items' in entry;
}
