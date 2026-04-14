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
} from '@tabler/icons-react';
import {
  Accordion,
  Anchor,
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
import classes from './Welcome.module.css';

// Set to true once you add real screenshots to /public/
const HAS_SCREENSHOTS = false;

function ScreenshotPlaceholder({
  src,
  alt,
  label,
  height = 400,
}: {
  src: string;
  alt: string;
  label: string;
  height?: number;
}) {
  if (!HAS_SCREENSHOTS) {
    return (
      <Paper shadow="xl" p={4} radius="lg" bg="dark.8" my={16}>
        <Center h={height} style={{ borderRadius: 'var(--mantine-radius-md)' }} bg="dark.7">
          <Stack align="center" gap="xs">
            <IconPhoto size={48} color="var(--mantine-color-dark-3)" />
            <Text c="dark.3" size="sm">{label}</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper shadow="xl" p={4} radius="lg" bg="dark.8" my={16}>
      <Image src={src} alt={alt} radius="md" />
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
            href="#download"
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
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" my={64}>
        <ScreenshotPlaceholder
          src="/screenshot-diff.png"
          alt="Inline diff viewer"
          label="Diff Viewer"
          height={300}
        />
        <ScreenshotPlaceholder
          src="/screenshot-detail.png"
          alt="Repository detail panel"
          label="Detail Panel"
          height={300}
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
                href="#"
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
        <Accordion variant="separated" radius="md" w="100%" maw={700} mt="md">
          <Accordion.Item value="what">
            <Accordion.Control>What is FinderGit?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                FinderGit is a native macOS application that works as a Git-aware file browser.
                Think of it as Finder&apos;s list view, but with Git status, branch info, inline diffs,
                and commit/push/pull actions built in.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="free">
            <Accordion.Control>Is FinderGit free?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                Yes, FinderGit is currently free. If you find it useful, consider{' '}
                <Anchor href="https://github.com/sponsors/gfazioli" size="sm">
                  sponsoring the project
                </Anchor>.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="macos">
            <Accordion.Control>What macOS version do I need?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                macOS 15 (Sequoia) or later. FinderGit is built with SwiftUI and uses APIs
                available from macOS 15+.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="replace">
            <Accordion.Control>Does FinderGit replace my Git client?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                Not entirely. FinderGit is great for everyday operations (status check, commit,
                push, pull) across many repos at once. For advanced workflows (interactive rebase,
                cherry-pick, complex merges), you&apos;ll still want a full Git client or the terminal.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="unsigned">
            <Accordion.Control>Why does macOS say the app is from an unidentified developer?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                FinderGit is not yet signed with an Apple Developer ID certificate. To open it,
                right-click the app, choose &quot;Open&quot;, then click &quot;Open&quot; in the confirmation dialog.
                You only need to do this once.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="detect">
            <Accordion.Control>How does FinderGit detect repositories?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                When you add a root folder, FinderGit recursively scans for directories containing
                .git/. The scan depth is configurable in Settings (default: 5 levels). Heavy
                directories like node_modules and DerivedData are automatically skipped.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="modify">
            <Accordion.Control>Does FinderGit modify my repositories?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                Only when you explicitly perform an action (commit, push, pull, stage, etc.).
                FinderGit reads your repository state via git status and git diff — it never
                modifies anything without your command.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="live">
            <Accordion.Control>How does the live update work?</Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">
                FinderGit uses macOS FSEvents to monitor file system changes in real time. When a
                file changes inside a watched repository, the status is automatically refreshed
                within ~300ms.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Container>
  );
}
