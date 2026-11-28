'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSelectedLayoutSegment } from 'next/navigation';
import { IconBrandDiscord, IconBrandGithub } from '@tabler/icons-react';
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  ScrollArea,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys, useLocalStorage, useMediaQuery } from '@mantine/hooks';
import config from '@/config';
import { DOCS_SEGMENT } from '@/lib/docs/routes';
import {
  isStoredCollapsed,
  SIDEBAR_COLLAPSED_ATTRIBUTE,
  SIDEBAR_COLLAPSED_KEY,
} from '@/lib/docs/sidebar';
import { isMenu, type DocsNode, type TopNavEntry } from '@/lib/docs/types';
import { ColorSchemeControl } from '../../ColorSchemeControl/ColorSchemeControl';
import { MantineNavBar } from '../../MantineNavBar/MantineNavBar';
import { SidebarToggle } from '../SidebarToggle/SidebarToggle';
import { SidebarTree } from '../SidebarTree/SidebarTree';
import classes from './SiteShell.module.css';

export interface SiteShellProps {
  tree: DocsNode[];
  nav: TopNavEntry[];
  banner?: React.ReactNode;
  /** The footer under docs pages */
  docsFooter: React.ReactNode;
  /** The footer under every other page */
  siteFooter: React.ReactNode;
  children: React.ReactNode;
}

/** The header links, stacked, at the top of the mobile navigation. */
function MobileNav({ nav }: { nav: TopNavEntry[] }) {
  return (
    <>
      {nav.flatMap((entry) =>
        isMenu(entry)
          ? [
              <NavLink key={entry.key} label={entry.title} component="button" childrenOffset="sm">
                {entry.items.map((item) => (
                  <NavLink
                    key={item.key}
                    label={item.title}
                    href={item.href}
                    target={item.newWindow ? '_blank' : undefined}
                    rel={item.newWindow ? 'noopener noreferrer' : undefined}
                  />
                ))}
              </NavLink>,
            ]
          : [
              <NavLink
                key={entry.key}
                label={entry.title}
                href={entry.href}
                target={entry.newWindow ? '_blank' : undefined}
                rel={entry.newWindow ? 'noopener noreferrer' : undefined}
              />,
            ]
      )}
    </>
  );
}

/**
 * The page frame, on Mantine's `AppShell`:
 * - the header on every page, with the release banner above the navigation, always in view;
 * - the docs sidebar on `/docs` routes (on a phone, behind the header's menu button, on every page),
 *   which a button (in the header, or at the foot of the sidebar: `config.docs.sidebar.toggle`) or
 *   ⌘B / Ctrl+B collapses on desktop, remembered across visits;
 * - a compact footer under docs pages, the full site footer elsewhere.
 *
 * The table of contents is not an `AppShell.Aside`: it lives in the docs page, as a sticky column,
 * so the footer can run the whole width right of the sidebar, as on mantine.dev.
 */
export function SiteShell({ tree, nav, banner, docsFooter, siteFooter, children }: SiteShellProps) {
  const pathname = usePathname();
  // A docs page is one the docs route rendered, not any `/docs` path: the 404 page is prerendered
  // once, outside the docs, and served for every missing path, so its HTML has no sidebar, and a
  // first render with one (from the pathname) did not match it (React error #418).
  const isDocs = useSelectedLayoutSegment() === DOCS_SEGMENT;

  const [opened, { toggle, close }] = useDisclosure(false);
  useEffect(() => {
    close();
  }, [pathname, close]);

  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage({
    key: SIDEBAR_COLLAPSED_KEY,
    defaultValue: false,
    getInitialValueInEffect: true,
  });
  // The pre-paint attribute (lib/docs/sidebar.ts) goes once the stored "collapsed" is committed,
  // when AppShell's own variables hold the sidebar closed, or once storage no longer says
  // "collapsed" (another tab expanded it between the script and this effect).
  useEffect(() => {
    if (sidebarCollapsed || !isStoredCollapsed()) {
      document.documentElement.removeAttribute(SIDEBAR_COLLAPSED_ATTRIBUTE);
    }
  }, [sidebarCollapsed]);

  // With the toggle at the foot of the sidebar there are two buttons, and the one pressed goes out
  // of view: the keyboard focus moves to the other, instead of falling to the page.
  const togglePlacement = config.docs.sidebar.toggle;
  const refocus = useRef<string | null>(null);
  const toggleSidebar = useCallback(() => {
    const from = document.activeElement?.closest<HTMLElement>('[data-sidebar-toggle]');
    refocus.current =
      togglePlacement === 'sidebar' && from
        ? from.dataset.sidebarToggle === 'header'
          ? 'sidebar'
          : 'header'
        : null;
    setSidebarCollapsed((collapsed) => !collapsed);
  }, [setSidebarCollapsed, togglePlacement]);
  useEffect(() => {
    const target = refocus.current;
    refocus.current = null;
    const button =
      target && document.querySelector<HTMLElement>(`[data-sidebar-toggle="${target}"]`);
    if (!button) {
      return undefined;
    }
    // An opening sidebar turns visible a frame or so later (its visibility is transitioned), and
    // a hidden button takes no focus: try once a frame until it does, for a few frames at most.
    let frame = 0;
    let tries = 10;
    const focus = () => {
      button.focus();
      if (document.activeElement !== button && --tries > 0) {
        frame = requestAnimationFrame(focus);
      }
    };
    focus();
    return () => cancelAnimationFrame(frame);
  }, [sidebarCollapsed]);
  useHotkeys(isDocs ? [['mod+B', toggleSidebar]] : []);

  const desktopCollapsed = !isDocs || sidebarCollapsed;

  // Hidden (outside the docs, collapsed, the phone's closed sheet) the sidebar is still in the page,
  // and Next prefetched its links: no prefetching then.
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
  const sidebarVisible = isDesktop ? !desktopCollapsed : opened;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !opened, desktop: desktopCollapsed },
      }}
      classNames={{ header: classes.header, navbar: classes.navbar }}
    >
      {/* First in the tab order, shown only while it has focus: past the header and the sidebar
          in one press, as Nextra's "Skip to Content" did. */}
      <a href="#main-content" className={classes.skipLink}>
        Skip to content
      </a>
      {/* The desktop toggle, on docs pages, in the header or at the foot of the sidebar
          (`config.docs.sidebar.toggle`). At the foot, the header's is there to bring a collapsed
          sidebar back: always rendered, hidden by CSS while the sidebar is open, so a stored
          "collapsed" shows it from the first paint (SiteShell.module.css). */}
      <AppShell.Header data-toggle={togglePlacement} data-collapsed={sidebarCollapsed || undefined}>
        {banner}
        <MantineNavBar
          nav={nav}
          burgerOpened={opened}
          onBurgerClick={toggle}
          sidebar={
            isDocs
              ? { collapsed: sidebarCollapsed, onToggle: toggleSidebar, placement: 'header' }
              : undefined
          }
        />
      </AppShell.Header>

      <AppShell.Navbar
        data-desktop-collapsed={desktopCollapsed || undefined}
        data-mobile-collapsed={!opened || undefined}
        // A link that stays on the page (a `#` anchor, say a sponsors section) changes no
        // pathname, and left the phone's full-width navbar open over the place it scrolled to.
        // Any link closes it; folders and menus are buttons, so they open and close in place.
        onClick={(event) => (event.target as HTMLElement).closest('a[href]') && close()}
      >
        <AppShell.Section hiddenFrom="md" className={classes.mobileNav}>
          <MobileNav nav={nav} />
        </AppShell.Section>
        <AppShell.Section grow component={ScrollArea} type="hover" className={classes.tree}>
          <SidebarTree
            tree={tree}
            defaultMenuCollapseLevel={config.docs.sidebar.defaultMenuCollapseLevel}
            prefetch={sidebarVisible}
          />
        </AppShell.Section>
        <AppShell.Section className={classes.navbarFooter}>
          <Group justify="space-between">
            <Group gap={4}>
              <Tooltip label="GitHub">
                <ActionIcon
                  component="a"
                  href={config.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="GitHub repository"
                >
                  <IconBrandGithub size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Discord">
                <ActionIcon
                  component="a"
                  href={config.links.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={config.links.discordLabel}
                >
                  <IconBrandDiscord size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap={4}>
              {config.docs.colorSchemeControl && <ColorSchemeControl />}
              {isDocs && togglePlacement === 'sidebar' && (
                <SidebarToggle
                  collapsed={sidebarCollapsed}
                  onToggle={toggleSidebar}
                  placement="sidebar"
                />
              )}
            </Group>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main id="main-content" className={classes.main}>
        {children}
        {isDocs ? docsFooter : siteFooter}
      </AppShell.Main>
    </AppShell>
  );
}
