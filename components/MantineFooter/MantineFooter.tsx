'use client';

import {
  IconBrandGithubFilled,
  IconBrandMantine,
  IconBrandVercel,
  IconBrandX,
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
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Logo } from '@/components/Logo/Logo';
import { AnimateBadge } from './AnimateBadge';
import { ecosystem, highlights, resources, sponsors } from './links';
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

export const MantineFooter = () => {
  return (
    <div className={classes.contentFooter}>
      <Container className={classes.footer} size="lg">
        <Grid grow>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Stack gap="xs">
              <Logo size={48} />
              <Text fz={13} mr={64}>
                FinderGit is a native macOS app that combines file browsing with Git intelligence.
                Built with SwiftUI by{' '}
                <Anchor fz={13} href="https://gfazioli.github.io/">
                  Undolog
                </Anchor>
                . Follow me on{' '}
                <Anchor fz={13} href="https://twitter.com/gfazioli">
                  Twitter
                </Anchor>{' '}
                or{' '}
                <Anchor fz={13} href="https://github.com/sponsors/gfazioli">
                  sponsor the project
                </Anchor>
                .
              </Text>
              <Group>
                <ActionIcon variant="subtle" component="a" href="https://github.com/gfazioli">
                  <IconBrandGithubFilled size={24} />
                </ActionIcon>
                <ActionIcon variant="subtle" component="a" href="https://twitter.com/gfazioli">
                  <IconBrandX size={24} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href="https://www.undolog.com/s/findergit"
                >
                  <IconMailHeart size={24} />
                </ActionIcon>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={2}>
            <Stack gap="xs">
              <Title className={classes.title} order={6}>
                HIGHLIGHTS
              </Title>
              <VerticalLinks list={highlights} />
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={2}>
            <Stack gap="xs">
              <Title className={classes.title} order={6}>
                RESOURCES
              </Title>
              <VerticalLinks list={resources} />
            </Stack>
          </Grid.Col>
          <Grid.Col className={classes.column} span={2}>
            <Stack gap="xs">
              <Title className={classes.title} order={6}>
                ECOSYSTEM
              </Title>
              <VerticalLinks list={ecosystem} />
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider my="xl" className={classes.lastDivider} />

        {/* Sponsors wall */}
        <Stack gap="md" align="center" id="sponsors" className={classes.sponsorsSection}>
          <Title order={2} ta="center" tt="uppercase">
            <Text
              inherit
              component="span"
              variant="gradient"
              gradient={{ from: 'pink', to: 'grape' }}
            >
              Sponsors
            </Text>
          </Title>
          <Text fz={15} c="dimmed" ta="center" maw={560}>
            If my open-source work saves you or your team time, consider sponsoring its development.
            Sponsors get their name or logo featured here and across all my projects' documentation
            sites.
          </Text>
          <Group justify="center" gap="xl">
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
                    size="lg"
                    radius="xl"
                  />
                  <Text fz={12} c="dimmed">
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
                <Avatar size="lg" radius="xl" className={classes.sponsorSlot}>
                  <IconPlus size={20} />
                </Avatar>
                <Text fz={12} c="dimmed">
                  Your logo here
                </Text>
              </Stack>
            </Anchor>
          </Group>
          <Button
            mb="xl"
            component="a"
            href="https://github.com/sponsors/gfazioli"
            target="_blank"
            rel="noopener noreferrer"
            variant="gradient"
            gradient={{ from: 'pink', to: 'grape' }}
            leftSection={<IconHeartFilled size={16} />}
            radius="xl"
          >
            Become a sponsor
          </Button>
        </Stack>

        <Divider my={16} className={classes.lastDivider} />

        <Group justify="center">
          <Group justify="center">
            <Text fz={12} inline>
              Made with ❤️ by{' '}
              <Anchor fz={13} href="https://gfazioli.github.io/">
                Undolog
              </Anchor>
            </Text>
            <Divider orientation="vertical" />
            <Text fz={12} inline>
              <Group gap={4} component="span">
                Hosted on{' '}
                <Anchor fz={13} href="https://vercel.com/">
                  <Group gap={4} component="span">
                    <IconBrandVercel size={16} /> Vercel
                  </Group>
                </Anchor>
              </Group>
            </Text>
            <Divider orientation="vertical" />
            <Text fz={12} inline>
              <Group gap={4} component="span" justify="flex-start">
                Built with{' '}
                <Anchor fz={13} href="https://mantine.dev/">
                  <Group gap={4} component="span">
                    <IconBrandMantine size={16} /> Mantine
                  </Group>
                </Anchor>
              </Group>
            </Text>
          </Group>
        </Group>
      </Container>
    </div>
  );
};
