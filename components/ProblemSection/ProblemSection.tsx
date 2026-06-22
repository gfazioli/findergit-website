'use client';

import type { CSSProperties } from 'react';
import { IconFolder, IconGitMerge, IconTerminal2 } from '@tabler/icons-react';
import { Box, Container, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import classes from './ProblemSection.module.css';

// Icon colours pick a vivid, distinct hue per tool so each card has a
// clear visual identity in both light and dark mode. The previous palette
// (gray / dark / blue) collapsed to barely-visible washes against the
// card backgrounds. Filled variants guarantee contrast on either theme
// without depending on the card's own surface colour.
const problems = [
  {
    icon: IconFolder,
    title: 'Finder',
    description: 'Shows files, but ',
    highlight: 'no Git state',
    rest: '. Your repos look like any other folder.',
    color: 'blue',
  },
  {
    icon: IconTerminal2,
    title: 'Terminal',
    description: 'Gives status, but ',
    highlight: 'no big picture',
    rest: '. One repo at a time, no visual overview.',
    color: 'teal',
  },
  {
    icon: IconGitMerge,
    title: 'Git GUIs',
    description: 'Powerful, but ',
    highlight: 'heavyweight',
    rest: '. Designed for deep work, not quick scanning.',
    color: 'grape',
  },
];

// The same five folders the Solution section then lights up — shown here in
// plain Finder (names only) so the Problem → Solution flow reads as one
// before/after, with no dedicated comparison section needed.
const finderRepos = ['my-ios-app', 'api-server', 'design-system', 'landing-page', 'cli-tools'];

export function ProblemSection() {
  return (
    <Box py={80} className={classes.sectionBand}>
      <Container size="lg">
        <Stack align="center" gap="md" mb={48}>
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
            The Problem
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
            Managing multiple Git repos shouldn&apos;t require juggling tools
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {problems.map((item) => (
            <Paper
              key={item.title}
              p="lg"
              className={classes.problemCard}
              // Per-card accent: resolve the card's Mantine palette hex into the
              // --card-color CSS var the card's tint/border/glow read.
              style={{ '--card-color': `var(--mantine-color-${item.color}-5)` } as CSSProperties}
            >
              <Stack gap={10} align="flex-start">
                <ThemeIcon
                  size={48}
                  radius="md"
                  color={item.color}
                  variant="light"
                  className={classes.problemIcon}
                >
                  <item.icon size={26} />
                </ThemeIcon>
                <Text fw={700} fz={18}>
                  {item.title}
                </Text>
                <Text c="dimmed" fz={14} lh={1.55}>
                  {item.description}
                  <Text component="span" c="red" fw={600} fz={14} td="underline">
                    {item.highlight}
                  </Text>
                  {item.rest}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>

        {/* The standard Finder — the "before": the same folders, just names and
            no Git state. Sets up the Solution's lit-up window right below. */}
        <Stack align="center" gap="sm" mt={56}>
          <Paper
            radius="lg"
            bg="var(--mantine-color-dark-7)"
            maw={680}
            w="100%"
            style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-dark-5)' }}
          >
            <Group
              px="md"
              py="sm"
              bg="var(--mantine-color-dark-6)"
              style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
            >
              <Group gap={8}>
                <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#febc2e' }} />
                <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#28c840' }} />
              </Group>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                Finder — ~/Developer
              </Text>
            </Group>
            <Stack gap={0} px="lg" py="md">
              {finderRepos.map((name) => (
                <Group
                  key={name}
                  gap="sm"
                  wrap="nowrap"
                  py="sm"
                  style={{ borderBottom: '1px solid var(--mantine-color-dark-6)' }}
                >
                  <IconFolder size={18} color="var(--mantine-color-dark-2)" />
                  <Text size="sm" c="gray.5" style={{ fontFamily: 'monospace' }}>
                    {name}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
          <Text c="dimmed" fz="sm" ta="center" maw={520}>
            Your ~/Developer in Finder today: just folders &mdash; no branch, no status,
            no idea which repo needs you.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
