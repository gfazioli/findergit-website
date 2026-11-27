import NextImage from 'next/image';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@mantine/core';
import { GOODIES_PRICE } from '@/lib/goodies';

/**
 * The Goodies under the newsletter in the scroll-triggered prompt
 * (`NewsletterModal`): asked for on 2026-11-27, *"aggiungendo la pubblicità dei
 * goodies oltre che l'iscrizione alla newsletter"*. The film's poster, one line
 * of what is in the pack, and a link to `/goodies`.
 *
 * The link moves within the site, and the prompt lives in the root layout,
 * which a client navigation keeps: `onNavigate` closes it, or it would stay
 * open over the shop. It is Link's `onNavigate`, not `onClick`: a Cmd-click
 * opens the shop in a new tab and leaves this one where it was, prompt and
 * all, without starting the day it stays closed.
 *
 * The picture is decorative (the heading names the pack), and loads only when
 * the prompt opens: Mantine's Modal renders its content only while it is open.
 */
export function GoodiesCallToAction({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Stack
      gap="xs"
      align="center"
      mt="lg"
      pt="lg"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      <NextImage
        src="/goodies/goodies-film-poster.jpg"
        alt=""
        width={1280}
        height={720}
        sizes="14rem"
        style={{ width: '14rem', height: 'auto', borderRadius: 'var(--mantine-radius-md)' }}
      />
      <Title order={2} size="h4" ta="center">
        FinderGit Goodies
      </Title>
      <Text c="dimmed" ta="center" size="sm" maw={420}>
        {`Screen savers, wallpapers and pixel folder emoji for your Mac, ${GOODIES_PRICE} once. Every purchase helps keep FinderGit free.`}
      </Text>
      <Button
        component={Link}
        href="/goodies"
        prefetch={false}
        onNavigate={onNavigate}
        variant="light"
        rightSection={<IconArrowRight size={16} />}
        radius="xl"
        mt="xs"
      >
        See the Goodies
      </Button>
    </Stack>
  );
}
