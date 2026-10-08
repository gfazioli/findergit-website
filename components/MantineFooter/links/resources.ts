import config from '@/config';

export const resources = [
  {
    key: 'docs',
    title: 'Documentation',
    href: '/docs',
  },
  {
    key: 'getting-started',
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    key: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    href: '/docs/keyboard-shortcuts',
  },
  {
    key: 'discord',
    title: 'Discord',
    href: config.community.discord,
    newWindow: true,
  },
  {
    key: 'issues',
    title: 'Report an Issue',
    href: 'mailto:feedback@findergit.app?subject=FinderGit%20feedback',
  },
  {
    key: 'undolog',
    title: 'Undolog Blog',
    href: 'https://undolog.com',
    newWindow: true,
  },
];
