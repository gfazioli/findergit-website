'use client';

import Link from 'next/link';
import { IconArrowRight, IconRefresh } from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

interface DiffLine {
  lineNum: number | [number, number];
  type: 'context' | 'addition' | 'deletion';
  content: string;
}

export const diffLines: DiffLine[] = [
  { lineNum: [14, 14], type: 'context', content: 'struct HeaderView: View {' },
  { lineNum: [15, 0], type: 'deletion', content: '    let title = "My App"' },
  { lineNum: [0, 15], type: 'addition', content: '    @State var title: String' },
  { lineNum: [0, 16], type: 'addition', content: '    @State var isExpanded = false' },
  { lineNum: [17, 17], type: 'context', content: '' },
  { lineNum: [18, 18], type: 'context', content: '    var body: some View {' },
  { lineNum: [19, 0], type: 'deletion', content: '        Text(title)' },
  { lineNum: [0, 19], type: 'addition', content: '        VStack {' },
  { lineNum: [0, 20], type: 'addition', content: '            Text(title).font(.headline)' },
  { lineNum: [0, 21], type: 'addition', content: '            if isExpanded {' },
  { lineNum: [0, 22], type: 'addition', content: '                DetailView()' },
  { lineNum: [0, 23], type: 'addition', content: '            }' },
  { lineNum: [0, 24], type: 'addition', content: '        }' },
  { lineNum: [25, 25], type: 'context', content: '    }' },
  { lineNum: [26, 26], type: 'context', content: '}' },
];

/**
 * The header counts are derived from the lines, so the mock cannot disagree
 * with itself. It used to: a hardcoded "+12 −4" sat above a body holding
 * eight additions and two deletions, and nothing ever compared the two.
 */
export const diffStats = diffLines.reduce(
  (acc, line) => ({
    additions: acc.additions + (line.type === 'addition' ? 1 : 0),
    deletions: acc.deletions + (line.type === 'deletion' ? 1 : 0),
  }),
  { additions: 0, deletions: 0 }
);

const KALEIDOSCOPE_DOCS = '/docs/diff-viewer#open-in-kaleidoscope';

function getLineColor(type: DiffLine['type']) {
  switch (type) {
    case 'addition':
      return { bg: 'rgba(40, 167, 69, 0.12)', color: '#28a745', prefix: '+' };
    case 'deletion':
      // A lighter red than the row's tint: #d73a49 measured 3.3:1 on the
      // mock's surface, this one 5.3:1.
      return { bg: 'rgba(215, 58, 73, 0.12)', color: '#f47067', prefix: '–' };
    default:
      return { bg: 'transparent', color: 'var(--mantine-color-dark-1)', prefix: ' ' };
  }
}

function getLineNumber(lineNum: DiffLine['lineNum'], type: DiffLine['type']) {
  if (Array.isArray(lineNum)) {
    const [old, new_] = lineNum;
    return {
      left: type === 'addition' ? '' : String(old),
      right: type === 'deletion' ? '' : String(new_),
    };
  }
  return { left: String(lineNum), right: String(lineNum) };
}

/**
 * One side of the two-pane comparison Kaleidoscope opens. Built from the
 * same lines as the inline diff above it — the old side keeps context and
 * deletions with the old numbering, the new side keeps context and
 * additions with the new one — so the two mocks are guaranteed to be
 * showing the same change.
 */
function ComparePane({ side }: { side: 'old' | 'new' }) {
  const lines = diffLines.filter((line) =>
    side === 'old' ? line.type !== 'addition' : line.type !== 'deletion'
  );
  return (
    <Box style={{ flex: 1, minWidth: 0 }}>
      <Text
        fz={10}
        fw={700}
        tt="uppercase"
        c="dimmed"
        px={10}
        py={6}
        style={{ letterSpacing: 1, borderBottom: '1px solid var(--mantine-color-dark-5)' }}
      >
        {side === 'old' ? 'HEAD' : 'Working tree'}
      </Text>
      {lines.map((line, idx) => {
        const style = getLineColor(line.type);
        const nums = getLineNumber(line.lineNum, line.type);
        return (
          <Group key={idx} gap={0} wrap="nowrap" style={{ backgroundColor: style.bg }}>
            <Text
              fz={10}
              c="dark.2"
              ta="right"
              w={28}
              px={6}
              py={1}
              ff="monospace"
              style={{ flexShrink: 0, userSelect: 'none' }}
            >
              {side === 'old' ? nums.left : nums.right}
            </Text>
            <Text
              fz={10}
              c={style.color}
              px={8}
              py={1}
              ff="monospace"
              style={{ whiteSpace: 'pre', flex: 1, overflow: 'hidden' }}
            >
              {line.content}
            </Text>
          </Group>
        );
      })}
    </Box>
  );
}

const handoffPoints = [
  'The committed version on the left, your working copy on the right, in a tab named for the file.',
  'Binary files arrive intact — an image is compared as an image, not as a wall of unprintable characters.',
  'A file you just created, or one you deleted? The missing side opens empty, not as an error.',
];

export function DiffViewerSection() {
  return (
    <Box py={80}>
      <Container size="lg">
        <Stack align="center" gap="md" mb={48}>
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="findergit.3">
            Diff Viewer
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900} c="white">
            See every change at a glance
          </Title>
          <Text c="gray.4" ta="center" size="lg" maw={620}>
            Inline, with line numbers and one-click stage &mdash; or in Kaleidoscope, when you have
            it.
          </Text>
        </Stack>

        <Paper
          radius="lg"
          bg="var(--mantine-color-dark-7)"
          style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-dark-5)' }}
          maw={800}
          mx="auto"
        >
          {/* File header */}
          <Group
            justify="space-between"
            px="lg"
            py="sm"
            bg="var(--mantine-color-dark-6)"
            style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
          >
            <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
              src/components/Header.swift
            </Text>
            <Group gap="xs">
              <Text size="sm" c="green" fw={600}>
                +{diffStats.additions}
              </Text>
              <Text size="sm" c="red" fw={600}>
                -{diffStats.deletions}
              </Text>
            </Group>
          </Group>

          {/* The two buttons a file's detail carries above its diff. Decorative
              here — a real button that does nothing is a trap for keyboard
              users, so they render as styled spans. */}
          <Group
            px="lg"
            py={8}
            gap="xs"
            aria-hidden="true"
            style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
          >
            <Button
              component="span"
              size="compact-xs"
              variant="default"
              leftSection={<IconRefresh size={12} />}
            >
              Refresh Diff
            </Button>
            <Button
              component="span"
              size="compact-xs"
              variant="light"
              color="orange"
              leftSection={<Image src="/kaleidoscope-icon.png" alt="" w={14} h={14} />}
            >
              Open in Kaleidoscope
            </Button>
          </Group>

          {/* Diff lines */}
          <Box style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {diffLines.map((line, idx) => {
              const style = getLineColor(line.type);
              const nums = getLineNumber(line.lineNum, line.type);
              return (
                <Group key={idx} gap={0} wrap="nowrap" style={{ backgroundColor: style.bg }}>
                  <Text
                    size="xs"
                    c="dark.2"
                    ta="right"
                    w={40}
                    px={8}
                    py={2}
                    style={{ flexShrink: 0, userSelect: 'none' }}
                  >
                    {nums.left}
                  </Text>
                  <Text
                    size="xs"
                    c="dark.2"
                    ta="right"
                    w={40}
                    px={8}
                    py={2}
                    style={{
                      flexShrink: 0,
                      userSelect: 'none',
                      borderRight: '1px solid var(--mantine-color-dark-5)',
                    }}
                  >
                    {nums.right}
                  </Text>
                  <Text
                    size="xs"
                    c={style.color}
                    px={12}
                    py={2}
                    style={{ whiteSpace: 'pre', flex: 1, overflow: 'hidden' }}
                  >
                    {style.prefix} {line.content}
                  </Text>
                </Group>
              );
            })}
          </Box>
        </Paper>

        {/* ─── Hand-off to Kaleidoscope ─── */}
        <Grid gap={{ base: 32, md: 56 }} align="center" mt={80}>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              {/* The icon sits on a blurred spectrum ring: Kaleidoscope's own
                  colours, so the mark reads as theirs rather than as one more
                  tinted tile in our palette. */}
              <Box pos="relative" w={72} h={72}>
                <Box
                  aria-hidden="true"
                  pos="absolute"
                  style={{
                    inset: -14,
                    borderRadius: '50%',
                    background:
                      'conic-gradient(from 200deg, #ff3b30, #ffcc00, #34c759, #32ade6, #5e5ce6, #ff2d55, #ff3b30)',
                    filter: 'blur(26px)',
                    opacity: 0.55,
                  }}
                />
                <Image
                  src="/kaleidoscope-icon.png"
                  alt="Kaleidoscope app icon"
                  w={72}
                  h={72}
                  pos="relative"
                />
              </Box>
              <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="findergit.3">
                Works with Kaleidoscope
              </Text>
              <Title order={3} fz={{ base: 24, sm: 30 }} fw={800} lh={1.15} c="white">
                Or hand the diff to Kaleidoscope
              </Title>
              <Text c="gray.4" size="md" lh={1.65}>
                Some diffs want a real comparison tool. If you have Kaleidoscope installed, one
                click beside <em>Refresh Diff</em> sends the file over &mdash; no setup, nothing to
                configure. Without it, the button simply isn&apos;t there.
              </Text>
              <Stack gap={8}>
                {handoffPoints.map((point) => (
                  <Group key={point} gap={10} wrap="nowrap" align="flex-start">
                    <Box
                      mt={9}
                      w={6}
                      h={6}
                      style={{
                        flexShrink: 0,
                        borderRadius: '50%',
                        backgroundColor: 'var(--fg-sky)',
                      }}
                    />
                    <Text c="gray.4" size="sm" lh={1.55}>
                      {point}
                    </Text>
                  </Group>
                ))}
              </Stack>
              <Button
                component={Link}
                href={KALEIDOSCOPE_DOCS}
                variant="subtle"
                color="gray"
                size="compact-md"
                rightSection={<IconArrowRight size={16} />}
                w="fit-content"
                px={0}
                c="white"
                aria-label="Learn more about opening a diff in Kaleidoscope"
              >
                Learn more
              </Button>
              <Text c="dimmed" fz="xs" lh={1.5}>
                Kaleidoscope is a registered trademark of Leitmotif GmbH, which is not affiliated
                with FinderGit. The button appears only when Kaleidoscope is installed.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            {/* Two-pane comparison, the way an external diff tool shows it.
                Same lines as the inline mock above; see ComparePane. */}
            <Paper
              radius="lg"
              bg="var(--mantine-color-dark-7)"
              style={{
                overflow: 'hidden',
                border: '1px solid var(--mantine-color-dark-5)',
                boxShadow: '0 30px 60px -20px rgba(255, 149, 0, 0.18)',
              }}
            >
              <Group
                px="md"
                py="sm"
                gap="sm"
                bg="var(--mantine-color-dark-6)"
                style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
              >
                <Group gap={8}>
                  <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                  <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#febc2e' }} />
                  <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#28c840' }} />
                </Group>
                <Image src="/kaleidoscope-icon.png" alt="" w={16} h={16} />
                <Text size="sm" c="dimmed" ff="monospace" truncate>
                  src/components/Header.swift &mdash; Text &mdash; {diffStats.additions} additions,{' '}
                  {diffStats.deletions} deletions
                </Text>
              </Group>
              {/* Side by side from `sm`; on a phone two 170px panes of code
                  truncate every line, so they stack instead. */}
              <Flex direction={{ base: 'column', sm: 'row' }} align="stretch">
                <ComparePane side="old" />
                <Box
                  w={{ base: '100%', sm: 1 }}
                  h={{ base: 1, sm: 'auto' }}
                  bg="var(--mantine-color-dark-5)"
                  style={{ flexShrink: 0 }}
                />
                <ComparePane side="new" />
              </Flex>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
