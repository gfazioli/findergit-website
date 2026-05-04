'use client';

import { Scene } from '@gfazioli/mantine-scene';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

// Static example output the model produces with the default Long+Emoji+
// Conventional config. Picked for variety (deps bump → likely
// recognizable to most devs without needing app-specific context).
const exampleSubject = 'chore: 📦 bump dependencies';
const exampleBody = [
  'Update Mantine packages to 9.1.1 for improved compatibility and bug fixes.',
  'Upgrade Storybook to 10.3.6 to include the latest UI enhancements.',
  'Bump oxlint, postcss, and rollup to newer patch releases for stability.',
];

export function AICommitSection() {
  return (
    <Box pos="relative" py={96} style={{ overflow: 'hidden' }}>
      {/*
        Decorative atmospheric background. `lazy` pauses the rAF loop and
        all child animations when the section leaves the viewport — zero
        re-renders while the user is scrolling elsewhere on the page.
        Color palette: grape/violet to evoke the ✨ "AI" association the
        in-app button uses, cyan accent matching the FinderGit brand to
        keep the section visually attached to the rest of the home.
      */}
      <Scene lazy>
        <Scene.Gradient from="grape" fromOpacity={0.08} to="violet" toOpacity={0.05} />
        <Scene.Glow color="grape" size={520} blur={160} opacity={0.28} top="-10%" left="-8%" />
        <Scene.Glow color="cyan" size={420} blur={140} opacity={0.18} top="85%" left="90%" />
        <Scene.DotGrid color="gray" opacity={0.12} spacing={28} />
        <Scene.Noise opacity={0.02} />
      </Scene>

      <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
        <Stack align="center" gap="md" mb={56}>
          <Group gap={8}>
            <IconSparkles size={18} color="var(--mantine-color-grape-5)" />
            <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="grape">
              AI
            </Text>
          </Group>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
            Commit messages, written for you
          </Title>
          <Text c="dimmed" ta="center" size="lg" maw={620}>
            Click the ✨ AI button next to the commit field — get a properly-formatted message from
            your staged diff in about a second. No setup, no API key, free for everyone.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} mt={32}>
          {/* Left column — copy + bullets + CTA */}
          <Stack gap="lg" justify="center">
            <List
              spacing="sm"
              size="md"
              icon={
                <ThemeIcon color="grape" size={22} radius="xl" variant="light">
                  <IconSparkles size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <Text fw={600} component="span">
                  One click, properly formatted
                </Text>
                <Text c="dimmed" size="sm">
                  Conventional Commits, optional emoji prefix, four tone presets, four length
                  presets — pick a default that fits your team.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600} component="span">
                  Bullet-list bodies that read well
                </Text>
                <Text c="dimmed" size="sm">
                  Long messages follow the de-facto OSS convention: subject, blank line, then `-`
                  bullets each describing one change and its motivation.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600} component="span">
                  Custom Instructions for your house style
                </Text>
                <Text c="dimmed" size="sm">
                  Enforce conventions the defaults can&apos;t express — ban specific words, always
                  reference an issue number, sign with your initials.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600} component="span">
                  Privacy-first
                </Text>
                <Text c="dimmed" size="sm">
                  Your staged diff is processed in-flight, never logged or stored. No personal
                  credentials required.
                </Text>
              </List.Item>
            </List>

            <Group>
              <Button
                component="a"
                href="/docs/ai-commit-messages"
                rightSection={<IconArrowRight size={16} />}
                color="grape"
                size="md"
                radius="xl"
              >
                How it works
              </Button>
            </Group>
          </Stack>

          {/* Right column — mock commit panel */}
          <Box>
            <Paper
              radius="lg"
              bg="var(--mantine-color-dark-7)"
              style={{
                border: '1px solid var(--mantine-color-dark-5)',
                boxShadow:
                  '0 30px 60px -20px rgba(125, 60, 200, 0.35), 0 0 0 1px rgba(255,255,255,0.02)',
                overflow: 'hidden',
              }}
            >
              {/* Window chrome */}
              <Group
                px="md"
                py={10}
                gap={8}
                bg="var(--mantine-color-dark-6)"
                style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
              >
                <Box w={12} h={12} bg="#ff5f57" style={{ borderRadius: 6 }} />
                <Box w={12} h={12} bg="#febc2e" style={{ borderRadius: 6 }} />
                <Box w={12} h={12} bg="#28c840" style={{ borderRadius: 6 }} />
                <Text size="xs" c="dimmed" ml="md" ff="monospace">
                  FinderGit — my-project (main)
                </Text>
              </Group>

              {/* Commit section header */}
              <Box p="md">
                <Group justify="space-between" mb="sm">
                  <Text fw={700} c="white">
                    Commit
                  </Text>
                  <Button
                    size="compact-sm"
                    variant="light"
                    color="grape"
                    leftSection={<IconSparkles size={14} />}
                  >
                    AI
                  </Button>
                </Group>

                {/* Mock TextField with the generated message */}
                <Paper
                  radius="md"
                  bg="var(--mantine-color-dark-8)"
                  p="md"
                  style={{ border: '1px solid var(--mantine-color-grape-7)' }}
                >
                  <Stack gap={4}>
                    <Text c="white" ff="monospace" size="sm" fw={600}>
                      {exampleSubject}
                    </Text>
                    <Box h={6} />
                    {exampleBody.map((line) => (
                      <Text key={line} c="gray.4" ff="monospace" size="sm" lh={1.5}>
                        - {line}
                      </Text>
                    ))}
                  </Stack>
                </Paper>

                {/* Action buttons mock */}
                <Group mt="md" gap="sm">
                  <Button size="xs" variant="filled" color="blue">
                    Commit Staged
                  </Button>
                  <Button size="xs" variant="default">
                    Commit All &amp; Push
                  </Button>
                </Group>
              </Box>
            </Paper>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
