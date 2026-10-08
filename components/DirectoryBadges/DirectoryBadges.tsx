import { Box, Text, type BoxProps } from '@mantine/core';
import config from '@/config';
import classes from './DirectoryBadges.module.css';

type Placement = (typeof config.directoryBadges)[number]['placement'];

/** The badges that go in one place, in config order. */
export function badgesFor(placement: Placement) {
  return config.directoryBadges.filter((badge) => badge.placement === placement);
}

/**
 * The badges of the directories FinderGit is listed on (`config.directoryBadges`)
 * that go in one place: under the hero, or in the footer's "Listed on" row
 * (`ListedOn`). Nothing at all when none goes there.
 *
 * Lazy, unlike the rest of the hero: React 19 preloads, at the top of the
 * document, every `<img>` the server renders without `loading="lazy"`, and the
 * Product Hunt badge alone used to be one of four images preloaded there, from
 * a third-party origin, alongside the icon and the first screenshot. A lazy
 * image near the viewport is still fetched as soon as the page is laid out; it
 * is just no longer queued ahead of what the hero is made of.
 *
 * The links carry no `nofollow`, `sponsored` or `ugc`: a directory that checks
 * its backlink refuses a link marked with any of them. And no `noreferrer`,
 * the site's usual pairing: a directory counts the visits it sends, and
 * LaunchNest's link has no UTM parameters to count them by.
 *
 * Style props (`mt`, ...) pass through; a `className` is not taken, since the
 * row's own class would replace it.
 */
export function DirectoryBadges({
  placement,
  ...props
}: { placement: Placement } & Omit<BoxProps, 'className'>) {
  const badges = badgesFor(placement);
  if (badges.length === 0) {
    return null;
  }
  return (
    <Box {...props} className={classes.badges} data-placement={placement}>
      {badges.map((badge) => (
        <a key={badge.name} href={badge.href} target="_blank" rel="noopener">
          <img
            className={classes.badge}
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            loading="lazy"
          />
        </a>
      ))}
    </Box>
  );
}

/**
 * The footer's row: a small label over the badges whose placement is the
 * footer, between the Support card and the colophon. Nothing when none is.
 */
export function ListedOn() {
  if (badgesFor('footer').length === 0) {
    return null;
  }
  return (
    <div className={classes.listedOn}>
      <Text fz={11} fw={700} tt="uppercase" c="dimmed" className={classes.label}>
        Listed on
      </Text>
      <DirectoryBadges placement="footer" />
    </div>
  );
}
