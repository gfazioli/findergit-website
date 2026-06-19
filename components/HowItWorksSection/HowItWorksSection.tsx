'use client';

import { Box, Container, Group, Stack, Text, Title } from '@mantine/core';
import classes from './HowItWorksSection.module.css';

/**
 * "How it works" — the disciplined 3-move band (Detect → Surface → Act) that
 * carries the narrative from scattered, invisible repos to one clear overview.
 * One idea per row, numbered 01/02/03, generous vertical rhythm. The step
 * numbers use the brand-accent token so colour stays meaningful.
 */
const steps = [
  {
    n: '01',
    label: 'Detect',
    body: 'Point FinderGit at a folder and it finds every Git repository inside — no setup, no per-repo bookmarking.',
  },
  {
    n: '02',
    label: 'Surface',
    body: 'Branch, status, uncommitted changes, and unpushed commits for each one — live, at a glance, in a single window.',
  },
  {
    n: '03',
    label: 'Act',
    body: 'Stage, commit, push, and switch branches inline — handle the day-to-day without leaving the browser or opening a terminal.',
  },
];

export function HowItWorksSection() {
  return (
    <Box py={96} className={classes.section}>
      <Container size="lg">
        <Stack align="center" gap="md" mb={64}>
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
            How it works
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900} maw={720}>
            From scattered repos to one clear overview
          </Title>
        </Stack>

        <Stack gap={0}>
          {steps.map((step) => (
            <Group
              key={step.n}
              align="flex-start"
              wrap="nowrap"
              gap="xl"
              className={classes.step}
            >
              <Text component="span" className={classes.stepNumber} aria-hidden>
                {step.n}
              </Text>
              <Stack gap={6} pt={{ base: 0, sm: 8 }}>
                <Title order={3} fz={{ base: 22, sm: 28 }} fw={800}>
                  {step.label}
                </Title>
                <Text c="dimmed" fz={{ base: 15, sm: 17 }} lh={1.55} maw={560}>
                  {step.body}
                </Text>
              </Stack>
            </Group>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
