'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBrandDiscordFilled,
  IconChevronDown,
  IconCoffee,
  IconExternalLink,
  IconHeartFilled,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Burger,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { isMenu, type TopNavEntry } from '@/lib/docs/types';
import { DISCORD_BLURPLE, discordLinkProps } from '../Discord/discord';
import { Logo } from '../Logo/Logo';
import { SearchTrigger } from '../shell/SearchTrigger/SearchTrigger';
import { SidebarToggle, type SidebarToggleProps } from '../shell/SidebarToggle/SidebarToggle';
import classes from './MantineNavBar.module.css';

export interface MantineNavBarProps {
  /** The header links, from `app/_meta.tsx` */
  nav: TopNavEntry[];
  /** The mobile menu button, which opens the sidebar */
  burgerOpened: boolean;
  onBurgerClick: () => void;
  /** The desktop sidebar toggle, on docs routes, when the sidebar is collapsed */
  sidebar?: SidebarToggleProps;
}

/** The header link of the section the page is in: `/docs` on every docs page. */
function isCurrent(pathname: string, entry: { href: string; newWindow?: boolean }) {
  return !entry.newWindow && (pathname === entry.href || pathname.startsWith(`${entry.href}/`));
}

function TopNav({ nav }: { nav: TopNavEntry[] }) {
  const pathname = usePathname();

  return (
    <Group component="nav" aria-label="Main" gap={4} wrap="nowrap" visibleFrom="md">
      {nav.map((entry) =>
        isMenu(entry) ? (
          <Menu key={entry.key} trigger="click-hover" position="bottom-start" withinPortal>
            <Menu.Target>
              <UnstyledButton className={classes.navLink}>
                <Group gap={4} wrap="nowrap">
                  {entry.title}
                  <IconChevronDown size={14} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              {entry.items.map((item) => (
                <Menu.Item
                  key={item.key}
                  component="a"
                  href={item.href}
                  target={item.newWindow ? '_blank' : undefined}
                  rel={item.newWindow ? 'noopener noreferrer' : undefined}
                  rightSection={
                    item.newWindow ? <IconExternalLink size={12} stroke={1.5} /> : undefined
                  }
                >
                  {item.title}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Anchor
            key={entry.key}
            component={Link}
            href={entry.href}
            target={entry.newWindow ? '_blank' : undefined}
            rel={entry.newWindow ? 'noopener noreferrer' : undefined}
            className={classes.navLink}
            data-active={isCurrent(pathname, entry) || undefined}
            // The section the page is in, said to assistive technology as well.
            aria-current={
              isCurrent(pathname, entry) ? (pathname === entry.href ? 'page' : 'true') : undefined
            }
            underline="never"
          >
            {entry.title}
          </Anchor>
        )
      )}
    </Group>
  );
}

/**
 * The site header, on the docs engine's `AppShell.Header` (the template's header, with
 * FinderGit's logo and controls): logo, the `app/_meta.tsx` links, search, then Discord, the
 * sponsor and the coffee. No GitHub icon (FinderGit's repository is private) and no colour
 * scheme switch (the site is dark only).
 */
export function MantineNavBar({ nav, burgerOpened, onBurgerClick, sidebar }: MantineNavBarProps) {
  return (
    <Group h={60} px="md" justify="space-between" wrap="nowrap" className={classes.inner}>
      <Group gap="xs" wrap="nowrap">
        <Burger
          opened={burgerOpened}
          onClick={onBurgerClick}
          hiddenFrom="md"
          size="sm"
          aria-label={burgerOpened ? 'Close navigation' : 'Open navigation'}
        />
        {sidebar && <SidebarToggle {...sidebar} />}
        <Anchor component={Link} href="/" underline="never" aria-label="FinderGit home">
          <Group align="center" gap={8} wrap="nowrap">
            <Logo />
            <Text size="lg" fw={600} c="var(--mantine-color-text)" visibleFrom="lg">
              FinderGit
            </Text>
          </Group>
        </Anchor>
      </Group>

      <Group gap="sm" wrap="nowrap">
        <TopNav nav={nav} />

        <SearchTrigger />

        {/* First, and in Discord's own colour: the server opened on 2026-10-08. */}
        <Tooltip label="Join us on Discord" withArrow>
          <ActionIcon
            component="a"
            {...discordLinkProps}
            size="lg"
            radius="xl"
            variant="filled"
            color={DISCORD_BLURPLE}
            aria-label="Join us on Discord"
          >
            <IconBrandDiscordFilled size={18} />
          </ActionIcon>
        </Tooltip>
        {/* GitHub Sponsors, not the footer's #sponsors card it used to scroll to. */}
        <Tooltip label="Sponsor" withArrow>
          <ActionIcon
            component="a"
            href="https://github.com/sponsors/gfazioli"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: 'pink', to: 'grape' }}
            aria-label="Sponsor"
          >
            <IconHeartFilled size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Buy me a coffee" withArrow>
          <ActionIcon
            component="a"
            href="https://donate.stripe.com/fZu4gy4Tn3b1dgudGx0co00"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            radius="xl"
            variant="filled"
            color="yellow"
            aria-label="Buy me a coffee"
            // Dark ink on the yellow: white on yellow-6 is 1.9:1.
            styles={{ root: { color: '#3b2600' } }}
          >
            <IconCoffee size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
