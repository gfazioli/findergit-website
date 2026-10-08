import config from '@/config';

/**
 * Discord's own blurple, from its brand guidelines. White on it is 4.6:1,
 * enough for the icon buttons and the white label of a filled button.
 */
export const DISCORD_BLURPLE = '#5865F2';

/** Every link to the server opens it in a new tab, the same way everywhere. */
export const discordLinkProps = {
  href: config.community.discord,
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
