'use client';

import { TextAnimate } from '@gfazioli/mantine-text-animate';
import {
  IconBrandApple,
  IconDownload,
  IconGitBranch,
  IconEye,
  IconTerminal2,
  IconSearch,
  IconColumns3,
  IconArrowRight,
  IconMarkdown,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { FAQ } from '../FAQ/FAQ';
import classes from './Welcome.module.css';

function ScreenshotPlaceholder({
  src,
  alt,
  label,
  height = 400,
  available = false,
}: {
  src: string;
  alt: string;
  label: string;
  height?: number;
  /** Set to true once the real screenshot file exists in /public/. */
  available?: boolean;
}) {
  if (!available) {
    return (
      <Paper shadow="xl" radius="lg" bg="dark.8" my={16} style={{ overflow: 'hidden' }}>
        <Center h={height} bg="dark.7">
          <Stack align="center" gap="xs">
            <IconPhoto size={48} color="var(--mantine-color-dark-3)" />
            <Text c="dark.3" size="sm">{label}</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper shadow="xl" radius="lg" my={16} style={{ overflow: 'hidden' }}>
      <Image src={src} alt={alt} display="block" />
    </Paper>
  );
}

const features = [
  {
    icon: IconColumns3,
    title: 'Sortable Columns',
    description:
      'Browse files in an outline table with sortable columns for Branch, Status, Changes, Size, and Date.',
    color: 'blue',
  },
  {
    icon: IconGitBranch,
    title: 'Live Git Status',
    description:
      'Every repo shows its branch, clean/dirty/unpushed state, and changed files — updated in real time.',
    color: 'green',
  },
  {
    icon: IconEye,
    title: 'Inline Diff Viewer',
    description:
      'Click any modified file to see a colored diff with line numbers, additions, and deletions.',
    color: 'orange',
  },
  {
    icon: IconTerminal2,
    title: 'Git Actions Built-in',
    description:
      'Stage, commit, push, pull, fetch, and switch branches without leaving the app.',
    color: 'violet',
  },
  {
    icon: IconSearch,
    title: 'Search & Filter',
    description:
      'Filter files by name instantly or toggle "Git Only" to show just your repositories.',
    color: 'cyan',
  },
  {
    icon: IconMarkdown,
    title: 'Markdown Preview',
    description:
      'Press Space on any .md file to see it beautifully rendered with a GitHub-style theme — no app switching.',
    color: 'grape',
  },
  {
    icon: IconBrandApple,
    title: 'Native macOS App',
    description:
      'Built with SwiftUI for a fast, native experience. Supports Quick Look, context menus, and keyboard shortcuts.',
    color: 'pink',
  },
];

export function Welcome() {
  return (
    <Container size="lg">
      {/* ─── Hero ─── */}
      <Stack align="center" gap="xl" py={80}>
        <Badge size="lg" variant="light" color="blue">
          Free for macOS 15+
        </Badge>

        <Image
          src="/icon-512x512.png"
          alt="FinderGit"
          w={{ base: 120, sm: 160, md: 200 }}
          h={{ base: 120, sm: 160, md: 200 }}
          style={{ borderRadius: 32 }}
        />

        <Title maw="90vw" mx="auto" className={classes.title} ta="center">
          Your repositories were never meant to be{' '}
          <TextAnimate
            animate="in"
            by="character"
            inherit
            variant="gradient"
            component="span"
            segmentDelay={0.12}
            duration={1.5}
            animation="scale"
            animateProps={{ scaleAmount: 2 }}
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            invisible.
          </TextAnimate>
        </Title>

        <Text c="dimmed" ta="center" size="xl" maw={640} mx="auto">
          FinderGit is a Git-aware file browser for macOS. See branch, status,
          changes, and diffs for all your repositories at a glance — without
          switching apps.
        </Text>

        <Group justify="center" mt="md">
          <Button
            href="https://github.com/gfazioli/findergit-website/releases/latest"
            component="a"
            leftSection={<IconDownload size={20} />}
            size="xl"
            radius="xl"
            px={40}
          >
            Download for macOS
          </Button>
          <Button
            href="/docs"
            component="a"
            rightSection={<IconArrowRight size={18} />}
            variant="subtle"
            size="xl"
          >
            See what it does
          </Button>
        </Group>
      </Stack>

      {/* ─── Screenshot ─── */}
      <ScreenshotPlaceholder
        src="/screenshot-hero.png"
        alt="FinderGit — Git-aware file browser for macOS"
        label="App Screenshot"
        height={500}
        available
      />

      {/* ─── Problem Statement ─── */}
      <Stack align="center" gap="md" my={64}>
        <Title order={2} ta="center">
          Managing multiple Git repos shouldn&apos;t be painful
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Finder shows you files, but not your Git state. Terminal gives you
          status, but not the big picture. FinderGit bridges the gap — one
          window, all your repos, live.
        </Text>
      </Stack>

      {/* ─── Features ─── */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" my={48}>
        {features.map((feature) => (
          <Stack key={feature.title} gap="xs" align="flex-start">
            <ThemeIcon size={48} radius="md" color={feature.color} variant="light">
              <feature.icon size={26} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              {feature.title}
            </Text>
            <Text c="dimmed" size="sm">
              {feature.description}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      {/* ─── More Screenshots ─── */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" my={64}>
        <ScreenshotPlaceholder
          src="/screenshot-diff.png"
          alt="Inline diff viewer"
          label="Diff Viewer"
          height={300}
          available
        />
        <ScreenshotPlaceholder
          src="/screenshot-detail.png"
          alt="Repository detail panel"
          label="Detail Panel"
          height={300}
          available
        />
        <ScreenshotPlaceholder
          src="/screenshot-markdown.png"
          alt="Native Markdown preview via Quick Look"
          label="Markdown Preview"
          height={300}
          available
        />
      </SimpleGrid>

      {/* ─── Download Section ─── */}
      <Box id="download" my={80}>
        <Stack align="center" gap="lg">
          <Title order={2} ta="center">
            Get FinderGit
          </Title>
          <Text c="dimmed" ta="center" size="lg" maw={500}>
            Download the latest release. Requires macOS 15 (Sequoia) or later.
          </Text>

          <Paper shadow="lg" p="xl" radius="lg" withBorder maw={500} w="100%">
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" color="blue" variant="light">
                <IconBrandApple size={36} />
              </ThemeIcon>
              <Title order={3}>macOS</Title>
              <Text c="dimmed" size="sm" ta="center">
                Universal binary (Apple Silicon + Intel).
                <br />
                Download the .dmg, open it, drag to Applications.
              </Text>
              <Button
                href="https://github.com/gfazioli/findergit-website/releases/latest"
                component="a"
                leftSection={<IconDownload size={20} />}
                size="lg"
                radius="xl"
                fullWidth
              >
                Download FinderGit.dmg
              </Button>
              <Text c="dimmed" size="xs">
                v1.0.0 — Requires macOS 15+
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Box>
      {/* ─── FAQ ─── */}
      <Stack align="center" gap="md" my={64}>
        <Title order={2} ta="center">
          Frequently Asked Questions
        </Title>
        <Box w="100%" maw={700} mt="md">
          <FAQ />
        </Box>
      </Stack>
    </Container>
  );
}
