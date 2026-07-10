'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  IconBrandBluesky,
  IconBrandLinkedin,
  IconBrandMastodon,
  IconBrandReddit,
  IconBrandX,
  IconBrandYcombinator,
  IconCheck,
  IconLink,
} from '@tabler/icons-react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import config from '@/config';

const ICON_SIZE = 18;

// Mastodon is federated, so there is no single canonical share endpoint.
// We route through a lightweight instance picker that lets the visitor pick
// their own server. Swap this constant for a different picker or a hardcoded
// instance if preferred.
const MASTODON_SHARE = 'https://mastodonshare.com/';

// e.g. "@gfazioli" -> "gfazioli" for the X `via` attribution param.
const X_HANDLE = (config.metadata.twitter?.creator ?? '').replace(/^@/, '');

type ShareTarget = {
  key: string;
  label: string;
  Icon: typeof IconBrandX;
  href: (url: string, title: string) => string;
};

const TARGETS: ShareTarget[] = [
  {
    key: 'x',
    label: 'X',
    Icon: IconBrandX,
    href: (url, title) => {
      const params = new URLSearchParams({ url, text: title });
      if (X_HANDLE) {
        params.set('via', X_HANDLE);
      }
      return `https://twitter.com/intent/tweet?${params}`;
    },
  },
  {
    key: 'bluesky',
    label: 'Bluesky',
    Icon: IconBrandBluesky,
    // Bluesky has no separate url param — the link goes inside the post text.
    href: (url, title) =>
      `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${title} ${url}` })}`,
  },
  {
    key: 'mastodon',
    label: 'Mastodon',
    Icon: IconBrandMastodon,
    href: (url, title) => `${MASTODON_SHARE}?${new URLSearchParams({ text: title, url })}`,
  },
  {
    key: 'reddit',
    label: 'Reddit',
    Icon: IconBrandReddit,
    href: (url, title) => `https://www.reddit.com/submit?${new URLSearchParams({ url, title })}`,
  },
  {
    key: 'hackernews',
    label: 'Hacker News',
    Icon: IconBrandYcombinator,
    href: (url, title) =>
      `https://news.ycombinator.com/submitlink?${new URLSearchParams({ u: url, t: title })}`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    Icon: IconBrandLinkedin,
    // LinkedIn no longer honours a custom title/summary — it reads the page's
    // Open Graph tags, so only the URL is passed.
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`,
  },
];

/**
 * A row of "share this page" buttons. Resolves the current page's absolute URL
 * from the pathname + the canonical site base, and uses the live document title
 * as the share text. Icon-only, tooltip-labelled, theme-aware.
 */
export const ShareButtons = () => {
  const pathname = usePathname();
  const clipboard = useClipboard({ timeout: 1500 });

  // Absolute URL of the current page, resolved against the canonical site base.
  const url = new URL(pathname || '/', config.metadata.metadataBase).toString();

  // Share text = the page <title>. Kept deterministic on first render (the
  // configured default) so SSR and client hydration agree, then upgraded to the
  // live document.title after mount — the value only ever feeds link query
  // strings, so the post-mount swap is invisible.
  const [title, setTitle] = useState<string>(config.metadata.title.default);
  useEffect(() => {
    if (typeof document !== 'undefined' && document.title) {
      setTitle(document.title);
    }
  }, [pathname]);

  return (
    <Group gap="xs">
      {TARGETS.map(({ key, label, Icon, href }) => (
        <Tooltip key={key} label={label} withArrow>
          <ActionIcon
            variant="subtle"
            component="a"
            href={href(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
          >
            <Icon size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      ))}
      <Tooltip label={clipboard.copied ? 'Copied!' : 'Copy link'} withArrow>
        <ActionIcon
          variant="subtle"
          color={clipboard.copied ? 'teal' : undefined}
          onClick={() => clipboard.copy(url)}
          aria-label="Copy link to this page"
        >
          {clipboard.copied ? <IconCheck size={ICON_SIZE} /> : <IconLink size={ICON_SIZE} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};
