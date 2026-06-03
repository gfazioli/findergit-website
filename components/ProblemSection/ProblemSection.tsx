'use client';

import type { CSSProperties } from 'react';
import { IconFolder, IconGitMerge, IconTerminal2 } from '@tabler/icons-react';
import { Box, Container, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
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

export function ProblemSection() {
  return (
    <Box py={80}>
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
      </Container>
    </Box>
  );
}
