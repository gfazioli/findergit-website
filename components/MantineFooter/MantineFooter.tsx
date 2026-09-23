'use client';

import {
  IconBrandGithubFilled,
  IconBrandMantine,
  IconBrandVercel,
  IconBrandX,
  IconCoffee,
  IconHeartFilled,
  IconMailHeart,
  IconPlus,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { Logo } from '@/components/Logo/Logo';
import { NewsletterSignup } from '@/components/NewsletterSignup/NewsletterSignup';
import { ShareButtons } from '@/components/ShareButtons/ShareButtons';
import { AnimateBadge } from './AnimateBadge';
import { apps, highlights, resources, sponsors } from './links';
import classes from './MantineFooter.module.css';

type VerticalLink = {
  key: string;
  title: string;
  href: string;
  newWindow?: boolean;
  new?: boolean;
};

const VerticalLinks = ({ list }: { list: VerticalLink[] }) => {
  return (
    <>
      {list.map((item) => (
        <Group key={item.key}>
          <Anchor
            className={classes.columnAnchor}
            href={item.href}
            target={item.newWindow ? '_blank' : undefined}
            rel={item.newWindow ? 'noopener noreferrer' : undefined}
          >
            {item.title}
          </Anchor>
          {item.new && <AnimateBadge />}
        </Group>
      ))}
    </>
  );
};

/*
 * No drawn rules anywhere in here. The footer used to be three bands stacked
 * between two full-width Dividers, with two vertical ones in the colophon: on
 * the night page each one was a bright line across the dark, and they were the
 * loudest thing in the footer. What separates things now is ground and
 * objects: the footer's own deeper ground fading in from the page, the
 * sponsor block as a card with its own edges, and space.
 */
export const MantineFooter = () => {
  return (
    <footer className={classes.contentFooter}>
      <Container className={classes.footer} size="lg">
        {/* The newsletter leads, and space separates it from the columns: no rule. */}
        <NewsletterSignup />

        <Grid grow mt={48}>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Stack gap="sm">
              <Logo size={44} />
              <Text fz={13} c="dimmed" maw={340} lh={1.6}>
                FinderGit is a native macOS app that combines file browsing with Git intelligence.
                Built by{' '}
                <Anchor fz={13} href="https://gfazioli.github.io/">
                  Undolog
                </Anchor>
                . Follow me on{' '}
                <Anchor fz={13} href="https://twitter.com/gfazioli">
                  X
                </Anchor>{' '}
                or{' '}
                <Anchor fz={13} href="https://github.com/sponsors/gfazioli">
                  sponsor the project
                </Anchor>
                .
              </Text>
              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href="https://github.com/gfazioli"
                  aria-label="GitHub"
                >
                  <IconBrandGithubFilled size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href="https://twitter.com/gfazioli"
                  aria-label="X"
                >
                  <IconBrandX size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href="https://findergit.substack.com"
                  aria-label="Newsletter"
                >
                  <IconMailHeart size={20} />
                </ActionIcon>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={{ base: 4, sm: 2 }}>
            <Stack gap={10}>
              <Text className={classes.title}>Highlights</Text>
              <VerticalLinks list={highlights} />
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={{ base: 4, sm: 2 }}>
            <Stack gap={10}>
              <Text className={classes.title}>Resources</Text>
              <VerticalLinks list={resources} />
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={{ base: 4, sm: 2 }}>
            <Stack gap={10}>
              <Text className={classes.title}>Apps</Text>
              <VerticalLinks list={apps} />
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Sponsors: a card, so its own edges do the separating. */}
        <div id="sponsors" className={classes.sponsors}>
          <div className={classes.sponsorsCopy}>
            <Group gap={8} wrap="nowrap">
              <IconHeartFilled size={18} className={classes.heart} />
              <Text fw={700} fz="lg">
                Support FinderGit
              </Text>
            </Group>
            <Text fz={14} c="dimmed" lh={1.6} mt={6}>
              If my open-source work saves you or your team time, consider sponsoring its
              development. Sponsors get their name or logo featured here and across all my
              projects&apos; documentation sites.
            </Text>
          </div>

          <div className={classes.sponsorsActions}>
            <Group gap="lg" justify="center">
              {sponsors.map((sponsor) => (
                <Anchor
                  key={sponsor.key}
                  href={sponsor.href ?? `https://github.com/${sponsor.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="never"
                >
                  <Stack gap={4} align="center">
                    <Avatar
                      src={`https://github.com/${sponsor.github}.png`}
                      alt={sponsor.name}
                      size="md"
                      radius="xl"
                    />
                    <Text fz={11} c="dimmed">
                      {sponsor.name}
                    </Text>
                  </Stack>
                </Anchor>
              ))}
              <Anchor
                href="https://github.com/sponsors/gfazioli"
                target="_blank"
                rel="noopener noreferrer"
                underline="never"
              >
                <Stack gap={4} align="center">
                  <Avatar size="md" radius="xl" className={classes.sponsorSlot}>
                    <IconPlus size={18} />
                  </Avatar>
                  <Text fz={11} c="dimmed">
                    Your logo here
                  </Text>
                </Stack>
              </Anchor>
            </Group>
            <Group gap="sm" justify="center">
              <Button
                component="a"
                href="https://github.com/sponsors/gfazioli"
                target="_blank"
                rel="noopener noreferrer"
                variant="gradient"
                // Shade 7, not Mantine's default 6: white on pink-6 is 3.7:1
                // and on grape-6 4.0:1; on these, 4.6:1 and 4.8:1.
                gradient={{ from: 'pink.7', to: 'grape.7' }}
                leftSection={<IconHeartFilled size={16} />}
                radius="xl"
              >
                Become a sponsor
              </Button>
              <Button
                component="a"
                href="https://donate.stripe.com/fZu4gy4Tn3b1dgudGx0co00"
                target="_blank"
                rel="noopener noreferrer"
                variant="filled"
                color="yellow"
                leftSection={<IconCoffee size={16} />}
                radius="xl"
                // Dark ink on the yellow, not white: white on yellow-6 measured
                // 1.9:1; this is about 8:1.
                styles={{
                  label: { color: '#3b2600' },
                  section: { color: '#3b2600' },
                }}
              >
                Buy me a coffee
              </Button>
            </Group>
          </div>
        </div>

        {/* Colophon and sharing on one line, parted by middots, not rules. */}
        <div className={classes.colophon}>
          <Text fz={12} c="dimmed" className={classes.credits}>
            Made with ❤️ by{' '}
            <Anchor fz={12} href="https://gfazioli.github.io/">
              Undolog
            </Anchor>
            <span className={classes.dot} aria-hidden>
              ·
            </span>
            Hosted on{' '}
            <Anchor fz={12} href="https://vercel.com/" className={classes.brand}>
              <IconBrandVercel size={13} /> Vercel
            </Anchor>
            <span className={classes.dot} aria-hidden>
              ·
            </span>
            Built with{' '}
            <Anchor fz={12} href="https://mantine.dev/" className={classes.brand}>
              <IconBrandMantine size={13} /> Mantine
            </Anchor>
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Text fz={11} fw={700} tt="uppercase" c="dimmed" className={classes.shareLabel}>
              Share
            </Text>
            <ShareButtons />
          </Group>
        </div>
      </Container>
    </footer>
  );
};
