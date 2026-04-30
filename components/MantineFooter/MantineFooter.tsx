'use client';

import {
  IconBrandGithubFilled,
  IconBrandMantine,
  IconBrandVercel,
  IconBrandX,
  IconMailHeart,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Logo } from '@/components/Logo/Logo';
import { AnimateBadge } from './AnimateBadge';
import { ecosystem, highlights, resources } from './links';
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
                FinderGit is a native macOS app that combines file browsing with Git
                intelligence. Built with SwiftUI by{' '}
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
                <ActionIcon variant="subtle" component="a" href="https://undolog.substack.com/">
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

        <Divider my={16} className={classes.lastDivider} />

        <Group justify="space-between">
          <iframe
            src="https://github.com/sponsors/gfazioli/button"
            title="Sponsor gfazioli"
            height="32"
            width="114"
            style={{ border: 0 }}
            sandbox="allow-popups allow-forms allow-scripts"
          />

          <Group justify="right">
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
