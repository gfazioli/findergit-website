'use client';

import { TextAnimate } from '@gfazioli/mantine-text-animate';
import {
  IconDownload,
  IconGitBranch,
  IconEye,
  IconSearch,
  IconColumns3,
  IconArrowRight,
  IconMarkdown,
  IconBolt,
} from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Badge,
  Center,
} from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import config from '@/config';
import { FAQ } from '../FAQ/FAQ';
import { ProblemSection } from '../ProblemSection/ProblemSection';
import { SolutionSection } from '../SolutionSection/SolutionSection';
import { DiffViewerSection } from '../DiffViewerSection/DiffViewerSection';
import { BuiltForMacSection } from '../BuiltForMacSection/BuiltForMacSection';
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
    icon: IconGitBranch,
    title: 'Live Git Status',
    description:
      'Branch, clean/dirty/unpushed state, changed files \u2014 updated in real time.',
    color: 'green',
  },
  {
    icon: IconColumns3,
    title: 'Sortable Columns',
    description:
      'Browse files in an outline table sorted by branch, status, changes, size, or date.',
    color: 'blue',
  },
  {
    icon: IconEye,
    title: 'Inline Diff Viewer',
    description:
      'Click any modified file to see a colored diff with line numbers.',
    color: 'orange',
  },
  {
    icon: IconBolt,
    title: 'Git Actions',
    description:
      'Stage, commit, push, pull, fetch, and switch branches without leaving the app.',
    color: 'violet',
  },
  {
    icon: IconSearch,
    title: 'Search & Filter',
    description:
      'Filter by name instantly or toggle "Git Only" to show just your repositories.',
    color: 'cyan',
  },
  {
    icon: IconMarkdown,
    title: 'Markdown Preview',
    description:
      'Press Space to preview .md files with a beautiful GitHub-style theme.',
    color: 'grape',
  },
];

export function Welcome() {
  return (
    <>
      {/* ─── Hero ─── */}
      <Container size="lg">
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
              href={config.app.downloadUrl}
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

          <Center mt="sm">
            <a
              href="https://www.producthunt.com/products/findergit/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-findergit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1207107&theme=neutral"
                alt="FinderGit - See every Git repo's status from one native Mac window | Product Hunt"
                width={250}
                height={54}
              />
            </a>
          </Center>
        </Stack>

        {/* ─── Screenshot ─── */}
        <ScreenshotPlaceholder
          src="/screenshot-hero.png"
          alt="FinderGit — Git-aware file browser for macOS"
          label="App Screenshot"
          height={500}
          available
        />
      </Container>

      {/* ─── The Problem ─── */}
      <ProblemSection />

      {/* ─── The Solution ─── */}
      <SolutionSection />

      {/* ─── Features ─── */}
      <Container size="lg">
        <Stack align="center" gap="md" mt={80} mb={48}>
          <Text
            size="sm"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: 3 }}
            c="orange"
          >
            Features
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
            Everything you need, nothing you don&apos;t
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mb={80}>
          {features.map((feature) => (
            <Paper key={feature.title} p="xl" radius="lg" withBorder>
              <Stack gap="xs" align="flex-start">
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
            </Paper>
          ))}
        </SimpleGrid>
      </Container>

      {/* ─── Diff Viewer ─── */}
      <DiffViewerSection />

      {/* ─── Built for macOS ─── */}
      <BuiltForMacSection />

      {/* ─── More Screenshots ─── */}
      <Container size="lg">
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
      </Container>

      {/* ─── Get Started CTA ─── */}
      <Box
        py={80}
        style={{
          backgroundColor: 'var(--mantine-color-dark-8)',
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="lg">
            <Text
              size="sm"
              fw={700}
              tt="uppercase"
              style={{ letterSpacing: 3 }}
              c="orange"
            >
              Get Started
            </Text>
            <Title
              order={2}
              ta="center"
              fz={{ base: 36, sm: 48 }}
              fw={900}
              c="white"
            >
              Your repos were never meant to be invisible.
            </Title>
            <Text c="dimmed" ta="center" size="lg" maw={500}>
              Download FinderGit and see everything, everywhere, all at once.
            </Text>

            <Button
              href={config.app.downloadUrl}
              component="a"
              leftSection={<IconDownload size={20} />}
              size="xl"
              radius="xl"
              px={48}
              color="orange"
              mt="md"
            >
              Download for macOS
            </Button>
            <Text c="dimmed" size="sm">
              Free &middot; macOS 15 Sequoia or later
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* ─── FAQ ─── */}
      <Container size="lg">
        <Stack align="center" gap="md" my={64}>
          <Text
            size="sm"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: 3 }}
            c="orange"
          >
            FAQ
          </Text>
          <Title order={2} ta="center">
            Frequently Asked Questions
          </Title>
          <Box w="100%" maw={700} mt="md">
            <FAQ />
          </Box>
        </Stack>
      </Container>
    </>
  );
}
