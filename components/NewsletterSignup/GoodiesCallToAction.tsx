import NextImage from 'next/image';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@mantine/core';
import { GOODIES_PRICE } from '@/lib/goodies';
import classes from './GoodiesCallToAction.module.css';

/** The app, as in "FinderGit Goodies" and "keep FinderGit free". */
const APP = 'FinderGit';

/** What the pack's emoji are, in the line under the heading. */
const EMOJI = 'pixel folder emoji';

/**
 * Three of the pack's pictures, the goods themselves: a wallpaper in front,
 * and dealt behind it a screen saver's still to its left and another wallpaper
 * to its right, each lit on the side that shows. Not the film's poster, whose
 * words repeat the heading under it.
 */
const PICTURES = {
  front: '/goodies/goodies-wallpaper-merge-rivers.jpg',
  left: '/goodies/goodies-saver-streak.jpg',
  right: '/goodies/goodies-wallpaper-contribution-city.jpg',
};

/**
 * The fill of "See the Goodies": the filled buttons' blue into the violet of
 * the pack's pictures. Both carry the button's white words at 4.5:1 or more.
 */
const FILL = 'linear-gradient(90deg, #2f73cc, #6d5bd0)';

/**
 * The pack's light behind the pictures, for the dialog that holds them
 * (`NewsletterModal` lays it on the dialog itself, so it reaches the top edge
 * behind the close button): the picture's own two lights, the blue to the
 * left and the violet to the right. Placed in rem from the top.
 */
export const GOODIES_WASH =
  'radial-gradient(20rem 17rem at 16% 7rem, rgb(47 115 204 / 50%), transparent 72%), ' +
  'radial-gradient(20rem 17rem at 86% 9rem, rgb(109 91 208 / 50%), transparent 72%)';

/**
 * The Goodies in the scroll-triggered prompt (`NewsletterModal`), above the
 * newsletter and as a promotion: asked for on 2026-11-27, *"aggiungendo la
 * pubblicità dei goodies oltre che l'iscrizione alla newsletter"*, then on
 * 2026-11-28 *"metti i Goodies prima della newsletter"* and *"deve essere una
 * promozione, quindi dovrebbe attirare l'attenzione e invitare l'utente a
 * cliccare"*. Three of the pack's pictures dealt as a fan, one line of what is
 * in the pack, and the one filled button of the prompt, to `/goodies`. The
 * apps' launch prompt draws the same (UndologUI's `SupportPrompt`), and the
 * stylesheet's header says what moves, once, and what never does.
 *
 * The link moves within the site, and the prompt lives in the root layout,
 * which a client navigation keeps: `onNavigate` closes it, or it would stay
 * open over the shop. It is Link's `onNavigate`, not `onClick`: a Cmd-click
 * opens the shop in a new tab and leaves this one where it was, prompt and
 * all, without starting the day it stays closed.
 *
 * The pictures are a second link to the shop, for the pointer alone: they are
 * decorative (the heading names the pack), so the link is hidden from a screen
 * reader and out of the Tab order, and the button under it is the one both
 * get. They load only when the prompt opens: Mantine's Modal renders its
 * content only while it is open.
 *
 * The line under the block divides it from the newsletter, and goes with it:
 * on the shop's own pages, where the Goodies are left out, there is none.
 */
export function GoodiesCallToAction({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Stack
      gap="xs"
      align="center"
      className={classes.goodies}
      style={{ '--goodies-fill': FILL } as React.CSSProperties}
    >
      <Link
        href="/goodies"
        prefetch={false}
        onNavigate={onNavigate}
        className={classes.fan}
        tabIndex={-1}
        aria-hidden
      >
        <Picture src={PICTURES.left} className={classes.left} sizes="16rem" />
        <Picture src={PICTURES.right} className={classes.right} sizes="16rem" />
        <Picture src={PICTURES.front} className={classes.front} sizes="16rem" />
        <Sparkle className={classes.sparkleOne} />
        <Sparkle className={classes.sparkleTwo} />
        <Sparkle className={classes.sparkleThree} />
      </Link>
      <Title order={2} size="h2" ta="center">
        {`${APP} Goodies`}
      </Title>
      <Text c="dimmed" ta="center" size="sm" maw={420}>
        {`Screen savers, wallpapers and ${EMOJI} for your Mac, ${GOODIES_PRICE} once. Every purchase helps keep ${APP} free.`}
      </Text>
      <Button
        component={Link}
        href="/goodies"
        prefetch={false}
        onNavigate={onNavigate}
        size="md"
        rightSection={<IconArrowRight size={18} className={classes.arrow} />}
        radius="xl"
        mt="xs"
        className={classes.cta}
      >
        See the Goodies
      </Button>
    </Stack>
  );
}

/** One card of the fan: a wallpaper at its own 16:9, cut to the card's corners. */
function Picture({ src, className, sizes }: { src: string; className: string; sizes: string }) {
  return (
    <span className={`${classes.card} ${className}`}>
      <NextImage
        src={src}
        alt=""
        width={1280}
        height={720}
        sizes={sizes}
        className={classes.picture}
      />
    </span>
  );
}

/** A four-pointed sparkle, in the current colour. */
function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${classes.sparkle} ${className}`} aria-hidden>
      <path
        fill="currentColor"
        d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12 7.5-1.8 11.1-5.4 12-12Z"
      />
    </svg>
  );
}
