'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cx from 'clsx';
import { IconExternalLink } from '@tabler/icons-react';
import { Collapse, Divider, MantineThemeProvider, NavLink, Text } from '@mantine/core';
import { normalizeRoute } from '@/lib/docs/routes';
import type { DocsNode } from '@/lib/docs/types';
import classes from './SidebarTree.module.css';

/**
 * Collapse's default, React's `<Activity>`, renders nothing on the server: `display-none` keeps a
 * closed folder's links in the served HTML, for crawlers.
 */
const SIDEBAR_THEME = {
  components: { Collapse: Collapse.extend({ defaultProps: { keepMountedMode: 'display-none' } }) },
};

function contains(node: DocsNode, route: string): boolean {
  if (node.kind === 'page') {
    return node.route === route;
  }
  if (node.kind === 'folder') {
    return node.children.some((child) => contains(child, route));
  }
  return false;
}

interface TreeNodeProps {
  node: DocsNode;
  route: string;
  level: number;
  collapseLevel: number;
  prefetch: boolean;
}

function TreeNode({ node, route, level, collapseLevel, prefetch }: TreeNodeProps) {
  if (node.kind === 'separator') {
    return node.title ? (
      // `data-sidebar-label`: a stable hook for a site's CSS, which never relies on DOM order
      <Text className={classes.label} mt="lg" mb={6} px="sm" data-sidebar-label>
        {node.title}
      </Text>
    ) : (
      <Divider my="sm" mx="sm" />
    );
  }

  if (node.kind === 'link') {
    return (
      <NavLink
        href={node.href}
        target={node.newWindow ? '_blank' : undefined}
        rel={node.newWindow ? 'noopener noreferrer' : undefined}
        label={node.title}
        rightSection={node.newWindow ? <IconExternalLink size={14} stroke={1.5} /> : undefined}
        className={classes.link}
      />
    );
  }

  if (node.kind === 'folder') {
    const active = contains(node, route);
    return (
      <NavLink
        // Re-mounted when the active page moves in or out, so a folder opens on its own when
        // search or a link lands on one of its pages.
        key={String(active)}
        // A folder only opens and closes: a button, not a link without an href, which crawlers
        // cannot follow (Lighthouse crawlable-anchors).
        component="button"
        label={node.title}
        defaultOpened={active || level < collapseLevel}
        classNames={{
          root: cx(classes.link, classes.folder, active && classes.folderActive),
          children: classes.children,
        }}
      >
        {node.children.map((child) => (
          <TreeNode
            key={child.key}
            node={child}
            route={route}
            level={level + 1}
            collapseLevel={collapseLevel}
            prefetch={prefetch}
          />
        ))}
      </NavLink>
    );
  }

  return (
    <NavLink
      component={Link}
      href={node.route}
      prefetch={prefetch ? undefined : false}
      label={node.title}
      active={node.route === route}
      variant="light"
      className={classes.link}
    />
  );
}

export interface SidebarTreeProps {
  tree: DocsNode[];
  /** Folders deeper than this open only when they hold the current page @default 1 */
  defaultMenuCollapseLevel?: number;
  /** Next.js prefetches the pages' links, off while the sidebar is hidden @default true */
  prefetch?: boolean;
}

/**
 * Brings the current page's link into the sidebar's view, centred, when it is out of it: a deep
 * page reached from search or a link would otherwise sit below the fold of a long sidebar.
 */
function useActiveInView(route: string) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const active = nav.current?.querySelector<HTMLElement>('a[data-active]');
    const viewport = nav.current?.closest<HTMLElement>('.mantine-ScrollArea-viewport');
    // Not when the folder holding it was closed by hand: a hidden link measures as zero
    if (!active || !viewport || active.getClientRects().length === 0) {
      return;
    }
    const top = active.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    if (top < 0 || top + active.offsetHeight > viewport.clientHeight) {
      viewport.scrollTop += top - (viewport.clientHeight - active.offsetHeight) / 2;
    }
  }, [route]);
  return nav;
}

/**
 * The docs sidebar: the `content/` tree on Mantine's `NavLink`.
 */
export function SidebarTree({
  tree,
  defaultMenuCollapseLevel = 1,
  prefetch = true,
}: SidebarTreeProps) {
  const route = normalizeRoute(usePathname());
  const nav = useActiveInView(route);

  return (
    <MantineThemeProvider theme={SIDEBAR_THEME}>
      <nav ref={nav} aria-label="Docs navigation">
        {tree.map((node) => (
          <TreeNode
            key={node.key}
            node={node}
            route={route}
            level={1}
            collapseLevel={defaultMenuCollapseLevel}
            prefetch={prefetch}
          />
        ))}
      </nav>
    </MantineThemeProvider>
  );
}
