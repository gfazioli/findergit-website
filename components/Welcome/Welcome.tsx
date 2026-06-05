'use client';

import { type CSSProperties, useState } from 'react';
import Link from 'next/link';
import { Scene } from '@gfazioli/mantine-scene';
import { TextAnimate } from '@gfazioli/mantine-text-animate';
import {
  IconDownload,
  IconGitBranch,
  IconEye,
  IconSearch,
  IconColumns3,
  IconArrowRight,
  IconCode,
  IconMarkdown,
  IconBolt,
  IconSparkles,
  IconGitCompare,
  IconDatabase,
  IconShieldHalfFilled,
} from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Image,
  Modal,
  Paper,
  UnstyledButton,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Badge,
  Center,
} from '@mantine/core';
import config from '@/config';
import { FAQ } from '../FAQ/FAQ';
import { ProblemSection } from '../ProblemSection/ProblemSection';
import { SolutionSection } from '../SolutionSection/SolutionSection';
import { DiffViewerSection } from '../DiffViewerSection/DiffViewerSection';
import { AICommitSection } from '../AICommitSection/AICommitSection';
import { BuiltForMacSection } from '../BuiltForMacSection/BuiltForMacSection';
import classes from './Welcome.module.css';

/**
 * Single feature row in the "In action" showcase. Pairs a large screenshot
 * with copy on the opposite side, alternating left/right per row to give
 * the section vertical rhythm. Mobile collapses both columns into a stack
 * with the screenshot always on top, regardless of `reverse` — copy
 * second is the natural reading order on a phone.
 */
function FeatureRow({
  icon: Icon,
  iconColor,
  title,
  description,
  image,
  imageAlt,
  href,
  reverse = false,
}: {
  icon: typeof IconMarkdown;
  iconColor: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Optional "Learn more" link to the feature's docs page. */
  href?: string;
  /** When true, copy is on the left and screenshot on the right at md+. */
  reverse?: boolean;
}) {
  // Each row renders inside the "In action" dark band (see Welcome()), so
  // the copy is forced to light colours — white title, gray-4 description —
  // rather than the theme-default near-black, which would be unreadable on
  // the dark backdrop in light mode.
  const copyCol = (
    <Stack gap="md" justify="center" h="100%">
      <ThemeIcon size={44} radius="md" variant="light" color={iconColor}>
        <Icon size={24} />
      </ThemeIcon>
      <Title order={3} fz={{ base: 24, sm: 30 }} fw={800} lh={1.15} c="white">
        {title}
      </Title>
      <Text c="gray.4" size="md" lh={1.65}>
        {description}
      </Text>
      {href && (
        <Button
          component={Link}
          href={href}
          variant="subtle"
          color="gray"
          size="compact-md"
          rightSection={<IconArrowRight size={16} />}
          w="fit-content"
          px={0}
          c="white"
        >
          Learn more
        </Button>
      )}
    </Stack>
  );

  // No Paper / border / radius wrapper: each screenshot already carries
  // its own macOS Tahoe-rounded window chrome inside the bitmap, so any
  // outer border just shrinks the perceived size and clashes with the
  // real chrome. `ZoomableScreenshot` uses `filter: drop-shadow` for
  // elevation (follows the alpha channel of the PNG instead of the
  // rectangular bounding box) and adds click-to-zoom so the user can
  // read the small text without us blowing up the image inline.
  const imageCol = <ZoomableScreenshot src={image} alt={imageAlt} />;

  // 7/5 split: the screenshot gets the dominant side (~58% of the row)
  // so detail like file names, branch labels and diff lines actually
  // becomes legible; the copy still has comfortable measure for the
  // headline + paragraph.
  // `Grid.Col.order` lets us alternate desktop side without breaking the
  // mobile reading order — image always stays on top in the stacked view.
  return (
    <Grid gap={{ base: 32, md: 56 }} align="center">
      <Grid.Col span={{ base: 12, md: 7 }} order={{ base: 1, md: reverse ? 2 : 1 }}>
        {imageCol}
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }} order={{ base: 2, md: reverse ? 1 : 2 }}>
        {copyCol}
      </Grid.Col>
    </Grid>
  );
}

/**
 * Click-to-zoom screenshot. The thumbnail uses a `drop-shadow` filter so
 * the soft halo follows the rounded macOS chrome already baked into each
 * PNG's alpha channel; clicking opens a fullscreen Modal where the same
 * image renders constrained to 95vw/95vh with `object-fit: contain` so
 * landscape and portrait shots both fit. The Modal closes on backdrop
 * click, on the system close button, and on Escape (Mantine default).
 */
function ZoomableScreenshot({
  src,
  alt,
  shadowOpacity = 0.55,
}: {
  src: string;
  alt: string;
  /** 0..1, drop-shadow alpha. The hero sits on a coloured wallpaper
   *  background, so a stronger shadow (higher alpha) reads better there
   *  — the dark feature-row backdrop tolerates a softer one. */
  shadowOpacity?: number;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      {/* `UnstyledButton` gives the thumbnail real button semantics — */}
      {/* keyboard focusability, Enter/Space activation, ARIA role —    */}
      {/* without imposing any visual chrome of its own. Plain `onClick`*/}
      {/* on the `Image` would not be reachable without a mouse.        */}
      <UnstyledButton
        onClick={() => setOpened(true)}
        aria-label={`Open enlarged screenshot: ${alt}`}
        style={{ display: 'block', width: '100%', cursor: 'zoom-in' }}
      >
        <Image
          src={src}
          alt={alt}
          display="block"
          style={{
            width: '100%',
            height: 'auto',
            filter: `drop-shadow(0 30px 60px rgba(0, 0, 0, ${shadowOpacity}))`,
          }}
        />
      </UnstyledButton>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        fullScreen
        withCloseButton
        padding={0}
        radius={0}
        transitionProps={{ transition: 'fade', duration: 180 }}
        styles={{
          content: { backgroundColor: 'transparent', boxShadow: 'none' },
          body: {
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            minHeight: '100vh',
          },
          header: {
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            zIndex: 10,
            padding: 0,
            minHeight: 0,
          },
          close: { color: 'white' },
        }}
      >
        <Image
          src={src}
          alt={alt}
          onClick={() => setOpened(false)}
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh',
            width: 'auto',
            height: 'auto',
            cursor: 'zoom-out',
            objectFit: 'contain',
          }}
        />
      </Modal>
    </>
  );
}

const features = [
  {
    icon: IconGitBranch,
    title: 'Live Git Status',
    description: 'Branch, clean/dirty/unpushed state, changed files \u2014 updated in real time.',
    color: 'green',
    href: '/docs/file-browser#git-indicators',
  },
  {
    icon: IconColumns3,
    title: 'Sortable Columns',
    description:
      'Browse files in an outline table sorted by branch, status, changes, size, or date.',
    color: 'blue',
    href: '/docs/file-browser#sorting',
  },
  {
    icon: IconEye,
    title: 'Inline Diff Viewer',
    description: 'Click any modified file to see a colored diff with line numbers.',
    color: 'orange',
    href: '/docs/diff-viewer',
  },
  {
    icon: IconBolt,
    title: 'Git Actions',
    description: 'Stage, commit, push, pull, fetch, and switch branches without leaving the app.',
    color: 'violet',
    href: '/docs/git-actions',
  },
  {
    icon: IconSearch,
    title: 'Search & Filter',
    description: 'Filter by name instantly or toggle "Git Only" to show just your repositories.',
    color: 'cyan',
    href: '/docs/file-browser#search-and-filter',
  },
  {
    icon: IconCode,
    title: 'Quick Look',
    description:
      'Press Space to preview any file in-window — syntax-highlighted code, rendered Markdown, images, PDFs and media.',
    color: 'grape',
    href: '/docs/file-browser#quick-look',
  },
  {
    icon: IconShieldHalfFilled,
    title: 'Repo Trust',
    description:
      'Surface the hooks that run code automatically in any repo — and get alerted when they change after a pull.',
    color: 'indigo',
    href: '/docs/repo-trust',
    badge: 'New',
  },
  {
    icon: IconDatabase,
    title: 'Repo Maintenance',
    description: 'See how much disk space each repo eats, then reclaim it with one-click cleanup.',
    color: 'teal',
    href: '/docs/repo-maintenance',
  },
  {
    icon: IconSparkles,
    title: 'AI Commit Messages',
    description:
      'Generate a properly-formatted commit message from your staged diff in a click — free, no API key.',
    color: 'pink',
    href: '/docs/ai-commit-messages',
  },
];

export function Welcome() {
  return (
    <>
      {/* ─── Hero ─── */}
      <Box pos="relative" style={{ overflow: 'hidden' }}>
        {/*
          The Scene background needs enough opacity to read on a *white*
          page (light mode) without becoming garish in dark mode. The
          combination below — soft mesh + two sized glows + dotgrid +
          noise — gives noticeable atmosphere on white and a richer wash
          on dark, with no theme-specific branching needed.
        */}
        <Scene lazy>
          <Scene.Mesh
            stops={[
              { color: 'blue', position: '20% 25%', spread: 55 },
              { color: 'cyan', position: '80% 70%', spread: 55 },
              { color: 'indigo', position: '50% 50%', spread: 70 },
            ]}
            opacity={0.22}
          />
          <Scene.Glow color="blue" size={560} blur={140} opacity={0.4} top="5%" left="-10%" />
          <Scene.Glow color="cyan" size={460} blur={120} opacity={0.32} top="65%" left="85%" />
          <Scene.DotGrid color="gray" opacity={0.14} spacing={32} />
          <Scene.Noise opacity={0.022} />
        </Scene>
        <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
          <Stack align="center" gap="xl" py={80}>
            <Badge
              size="lg"
              variant="filled"
              color="blue"
              style={{
                // Solid filled badge plus a soft brand-tinted shadow so it
                // reads as elevated against the Scene's blue/cyan wash —
                // the previous `variant="light"` blended into the
                // atmosphere and lost legibility on light mode.
                boxShadow: '0 8px 22px -8px rgba(0, 90, 200, 0.45)',
              }}
            >
              Free for macOS 15+
            </Badge>

            <Image
              src="/icon-512x512.png"
              alt="FinderGit"
              w={{ base: 120, sm: 160, md: 200 }}
              h={{ base: 120, sm: 160, md: 200 }}
              style={{
                // `filter: drop-shadow` (not box-shadow) follows the PNG's
                // alpha channel, so the shadow traces the icon's actual
                // rounded macOS-app-icon silhouette instead of the square
                // <img> bounding box. Two layered drops give depth without
                // the "rectangular halo behind a rounded shape" artifact.
                filter:
                  'drop-shadow(0 18px 26px rgba(0, 90, 200, 0.32)) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18))',
              }}
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
              FinderGit is a Git-aware file browser for macOS. See branch, status, changes, and
              diffs for all your repositories at a glance — without switching apps.
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
          <Box mt={32}>
            <ZoomableScreenshot
              src="/screenshot-hero.png"
              alt="FinderGit — Git-aware file browser for macOS"
              shadowOpacity={0.7}
            />
          </Box>
        </Container>
      </Box>

      {/* ─── The Problem ─── */}
      <ProblemSection />

      {/* ─── The Solution ─── */}
      <SolutionSection />

      {/* ─── Features ─── */}
      <Box py={80} className={classes.sectionBand}>
        <Container size="lg">
          <Stack align="center" gap="md" mb={48}>
            <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
              Features
            </Text>
            <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
              Everything you need, nothing you don&apos;t
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {features.map((feature) => (
              // Whole card is a Next.js Link via Mantine's polymorphic
              // `component` prop — keeps the Paper/Raycast card styling while
              // making the entire card clickable, keyboard-focusable, and
              // prefetched. `cardLink` resets the anchor's default text color /
              // underline and adds a focus-visible ring matching the hover tint.
              <Paper
                key={feature.title}
                component={Link}
                href={feature.href}
                p="lg"
                className={`${classes.featureCard} ${classes.cardLink}`}
                // Per-card accent: resolve the feature's Mantine palette hex
                // into the --card-color CSS var the card's tint/border/glow read.
                style={
                  { '--card-color': `var(--mantine-color-${feature.color}-5)` } as CSSProperties
                }
              >
                {'badge' in feature && feature.badge && (
                  <Badge className={classes.newBadge} variant="filled" size="sm" radius="sm">
                    {feature.badge}
                  </Badge>
                )}
                <Stack gap={10} align="flex-start">
                  <ThemeIcon
                    size={48}
                    radius="md"
                    color={feature.color}
                    variant="light"
                    className={classes.featureIcon}
                  >
                    <feature.icon size={26} />
                  </ThemeIcon>
                  <Text fw={700} fz={18}>
                    {feature.title}
                  </Text>
                  <Text c="dimmed" size="sm" lh={1.55}>
                    {feature.description}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ─── Diff Viewer ─── */}
      <DiffViewerSection />

      {/* ─── AI Commit Messages ─── */}
      <AICommitSection />

      {/* ─── Built for macOS ─── */}
      <BuiltForMacSection />

      {/* ─── In action — feature showcase with alternating image/copy rows ─── */}
      <Box py={96} style={{ backgroundColor: 'var(--mantine-color-dark-9)' }}>
        <Container size="xl">
          <Stack align="center" gap="md" mb={72}>
            <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="findergit.5">
              In action
            </Text>
            {/* This band sits on a hardcoded dark backdrop (the screenshots
                carry dark macOS chrome, so the dark band is intentional —
                same idiom as the Get Started CTA below). Force light text so
                the heading + copy read on the dark band in *both* schemes
                instead of falling back to the near-black default token in
                light mode. */}
            <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900} c="white">
              Built around the way you actually work
            </Title>
            <Text c="gray.4" ta="center" size="lg" maw={640}>
              Five touches that make Git feel native to the file browser — not bolted on top.
            </Text>
          </Stack>

          <Stack gap={96}>
            <FeatureRow
              icon={IconShieldHalfFilled}
              iconColor="indigo"
              title="Know what a repo runs before you trust it"
              description="Cloning or pulling a repo can quietly arm it to run code — on folder open, on agent load, on npm install. The Trust tab surfaces that auto-run surface in plain language, shows you exactly what each hook runs, and flags it in the browser when it changes after a pull. It only ever reads — FinderGit never executes anything it finds."
              image="/screenshot-feature-trust.png"
              imageAlt="The Repo Trust tab listing a repository's auto-run hooks with a plain-language explanation of what each one runs"
              href="/docs/repo-trust"
            />

            <FeatureRow
              icon={IconEye}
              iconColor="blue"
              title="Preview any file without leaving the browser"
              description="Press Space (or ⌘Y) on any file and FinderGit previews it inline — source code with full syntax highlighting, rendered Markdown, images, PDFs and media. Space or Escape closes it again, Finder-style. No app switch, no terminal round-trip when you're just trying to remember what a folder contains."
              image="/screenshot-feature-code-preview.png"
              imageAlt="Source code preview with syntax highlighting inside FinderGit"
              href="/docs/file-browser#quick-look"
              reverse
            />

            <FeatureRow
              icon={IconSparkles}
              iconColor="grape"
              title="Commit messages, generated from your diff"
              description="Click the ✨ button next to the commit field — get a properly-formatted message in about a second. Conventional Commits, optional emoji prefix, four tone presets. Free for everyone, no account, no API key to manage."
              image="/screenshot-feature-ai-commit.png"
              imageAlt="AI-generated commit message in the FinderGit detail panel"
              href="/docs/ai-commit-messages"
            />

            <FeatureRow
              icon={IconGitCompare}
              iconColor="cyan"
              title="Diffs at the file level, with one-click stage"
              description="Click any modified file and the detail panel shows the patch — additions in green, deletions in red, line numbers preserved. The Stage button right above adds the file to the index without dropping into a shell."
              image="/screenshot-feature-diff.png"
              imageAlt="File-level diff view in the FinderGit detail panel"
              href="/docs/diff-viewer"
              reverse
            />

            <FeatureRow
              icon={IconDatabase}
              iconColor="teal"
              title="Reclaim the space your repos waste"
              description="The Maintenance tab shows exactly where a repository's Git data goes — packs, loose objects, undo history. A one-click Optimize tidies it up, and a careful Deep Clean frees the rest while your stashes stay safe. And the Size column gives you every repo's footprint at a glance, so you always know which one to clean first."
              image="/screenshot-feature-maintenance.png"
              imageAlt="Repo Maintenance tab showing Git disk-space breakdown with Optimize and Deep Clean actions in FinderGit"
              href="/docs/repo-maintenance"
            />
          </Stack>
        </Container>
      </Box>

      {/* ─── Get Started CTA ─── */}
      <Box
        pos="relative"
        py={80}
        style={{
          backgroundColor: 'var(--mantine-color-dark-8)',
          overflow: 'hidden',
        }}
      >
        <Scene lazy>
          <Scene.StarField count={{ base: 60, md: 120 }} twinkle opacity={0.7} />
          <Scene.ShootingStar count={2} minInterval={5} maxInterval={12} opacity={0.5} />
          <Scene.Glow color="orange" size={500} blur={170} opacity={0.18} top="30%" left="50%" />
        </Scene>
        <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
          <Stack align="center" gap="lg">
            <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
              Get Started
            </Text>
            <Title order={2} ta="center" fz={{ base: 36, sm: 48 }} fw={900} c="white">
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
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
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
