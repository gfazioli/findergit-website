import { Group } from '@mantine/core';
import { IconCoffee, IconHeartFilled } from '@tabler/icons-react';

export default {
  index: {
    display: 'hidden',
  },
  // The home page's feature grid, as on netfox.app. An anchor, so Nextra
  // shows no external arrow.
  features: {
    type: 'page',
    title: 'Features',
    href: '/#features',
  },
  docs: {
    type: 'page',
    title: 'Documentation',
  },
  download: {
    type: 'page',
    title: 'Download',
    href: 'https://github.com/gfazioli/findergit-website/releases/latest',
  },
  community: {
    title: 'Community',
    type: 'menu',
    items: {
      newsletter: {
        title: 'Newsletter',
        href: 'https://findergit.substack.com',
      },
      issues: {
        title: 'Report an Issue',
        href: 'mailto:feedback@findergit.app?subject=FinderGit%20feedback',
      },
    },
  },
  about: {
    type: 'page',
    title: 'About',
    href: 'https://gfazioli.github.io/',
  },
  support: {
    title: 'Support',
    type: 'menu',
    items: {
      // The GitHub Sponsors page itself. This was `#sponsors`, which scrolled
      // to the footer's sponsor card, one step short of the page where
      // sponsoring happens. External, so Nextra adds its arrow like the coffee.
      sponsor: {
        title: (
          <Group component="span" gap={8} wrap="nowrap" align="center">
            <IconHeartFilled size={16} />
            Sponsor
          </Group>
        ),
        href: 'https://github.com/sponsors/gfazioli',
      },
      // External donation link — Nextra keeps the ↗ external indicator.
      coffee: {
        title: (
          <Group component="span" gap={8} wrap="nowrap" align="center">
            <IconCoffee size={16} />
            Buy me a coffee
          </Group>
        ),
        href: 'https://donate.stripe.com/fZu4gy4Tn3b1dgudGx0co00',
      },
    },
  },
};
