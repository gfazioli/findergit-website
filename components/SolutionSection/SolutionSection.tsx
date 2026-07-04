'use client';

import { IconFolder, IconLayoutList, IconShieldHalfFilled, IconStar, IconStarFilled } from '@tabler/icons-react';
import { Badge, Box, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';

type Trust = 'none' | 'hooks' | 'changed';

const repos: Array<{
  name: string;
  branch: string;
  branchColor: string;
  status: string;
  statusColor: string;
  statusIcon: string;
  dirty: boolean;
  stars: number;
  size: string;
  trust: Trust;
}> = [
  {
    name: 'my-ios-app',
    branch: 'main',
    branchColor: 'green',
    status: 'Clean',
    statusColor: 'teal',
    statusIcon: '✔',
    dirty: false,
    stars: 128,
    size: '24 MB',
    trust: 'none',
  },
  {
    name: 'api-server',
    branch: 'develop',
    branchColor: 'gray',
    status: '3 changes',
    statusColor: 'orange',
    statusIcon: '●',
    dirty: true,
    stars: 47,
    size: '156 MB',
    trust: 'hooks',
  },
  {
    name: 'design-system',
    branch: 'feat/tokens',
    branchColor: 'violet',
    status: '2 ahead',
    statusColor: 'blue',
    statusIcon: '↑',
    dirty: false,
    stars: 312,
    size: '8 MB',
    trust: 'none',
  },
  {
    name: 'landing-page',
    branch: 'main',
    branchColor: 'green',
    status: 'Clean',
    statusColor: 'teal',
    statusIcon: '✔',
    dirty: false,
    stars: 12,
    size: '3 MB',
    trust: 'none',
  },
  {
    name: 'cli-tools',
    branch: 'v2.0',
    branchColor: 'yellow',
    status: '1 change',
    statusColor: 'orange',
    statusIcon: '●',
    dirty: true,
    stars: 89,
    size: '41 MB',
    trust: 'changed',
  },
];

const trustHelp: Record<Exclude<Trust, 'none'>, string> = {
  hooks: 'Auto-run hooks — review before trusting',
  changed: 'Auto-run surface changed since last seen',
};

// The redesigned sidebar, in miniature: Library + status-driven Smart Views +
// remote Filters. `active` marks the current scope; `dot` is the Smart View's
// accent colour.
type SidebarItem = { section: string } | { label: string; count?: number; active?: boolean; dot?: string };

const sidebar: SidebarItem[] = [
  { section: 'Library' },
  { label: 'All Repositories', count: 5, active: true },
  { label: 'Favorites' },
  { section: 'Smart Views' },
  { label: 'Changes', count: 2, dot: 'orange' },
  { label: 'Ahead', count: 1, dot: 'blue' },
  { label: 'Clean', count: 2, dot: 'teal' },
  { section: 'Filters' },
  { label: 'GitHub' },
];

export function SolutionSection() {
  return (
    <Box
      py={80}
      style={{
        background:
          'radial-gradient(120% 120% at 50% 0%, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 70%)',
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="md" mb={48}>
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
            The Solution
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900} c="white">
            One window. All your repos. Always live.
          </Title>
        </Stack>

        {/* Mock window */}
        <Paper
          radius="lg"
          bg="var(--mantine-color-dark-7)"
          style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-dark-5)' }}
          maw={900}
          mx="auto"
        >
          {/* Title bar */}
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
              FinderGit — All Repositories
            </Text>
          </Group>

          {/* Body: status sidebar + repo list */}
          <Group gap={0} align="stretch" wrap="nowrap">
            {/* Sidebar */}
            <Stack
              gap={2}
              p="sm"
              w={186}
              visibleFrom="sm"
              style={{ flexShrink: 0, borderRight: '1px solid var(--mantine-color-dark-5)' }}
            >
              {sidebar.map((item, i) =>
                'section' in item ? (
                  <Text
                    key={item.section}
                    size="xs"
                    fw={700}
                    tt="uppercase"
                    c="dimmed"
                    mt={i === 0 ? 0 : 10}
                    mb={2}
                    style={{ letterSpacing: 1 }}
                  >
                    {item.section}
                  </Text>
                ) : (
                  <Group
                    key={item.label}
                    justify="space-between"
                    wrap="nowrap"
                    gap={6}
                    px={8}
                    py={4}
                    style={{
                      borderRadius: 6,
                      backgroundColor: item.active ? 'var(--mantine-color-findergit-light)' : undefined,
                    }}
                  >
                    <Group gap={7} wrap="nowrap" style={{ minWidth: 0 }}>
                      {item.dot ? (
                        <Box
                          w={7}
                          h={7}
                          style={{ borderRadius: '50%', backgroundColor: `var(--mantine-color-${item.dot}-5)`, flexShrink: 0 }}
                        />
                      ) : item.label === 'All Repositories' ? (
                        <IconLayoutList size={14} color="var(--mantine-color-findergit-4)" />
                      ) : item.label === 'Favorites' ? (
                        <IconStar size={14} color="var(--mantine-color-dark-2)" />
                      ) : (
                        <Box w={7} h={7} style={{ flexShrink: 0 }} />
                      )}
                      <Text size="xs" c={item.active ? 'findergit.4' : 'gray.4'} fw={item.active ? 600 : 400} truncate>
                        {item.label}
                      </Text>
                    </Group>
                    {item.count !== undefined && (
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        {item.count}
                      </Text>
                    )}
                  </Group>
                )
              )}
            </Stack>

            {/* Repo list */}
            <Stack gap={0} px="lg" py="md" style={{ flex: 1, minWidth: 0 }}>
              {repos.map((repo) => (
                <Group
                  key={repo.name}
                  justify="space-between"
                  wrap="nowrap"
                  py="sm"
                  style={{ borderBottom: '1px solid var(--mantine-color-dark-6)' }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <IconFolder size={18} color="var(--mantine-color-dark-2)" />
                    <Text size="sm" c="gray.3" style={{ fontFamily: 'monospace' }} truncate>
                      {repo.name}
                    </Text>
                    {repo.trust !== 'none' && (
                      <IconShieldHalfFilled
                        size={15}
                        color={
                          repo.trust === 'changed'
                            ? 'var(--mantine-color-orange-5)'
                            : 'var(--mantine-color-yellow-5)'
                        }
                        aria-label={trustHelp[repo.trust]}
                      />
                    )}
                  </Group>
                  <Group gap="sm" wrap="nowrap">
                    <Group gap={3} wrap="nowrap" visibleFrom="sm">
                      <IconStarFilled size={11} color="var(--mantine-color-yellow-5)" />
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        {repo.stars}
                      </Text>
                    </Group>
                    <Text
                      size="xs"
                      c="dimmed"
                      visibleFrom="sm"
                      style={{ fontFamily: 'monospace', minWidth: 52, textAlign: 'right' }}
                    >
                      {repo.size}
                    </Text>
                    <Badge variant="light" color={repo.branchColor} size="sm" radius="sm">
                      {repo.branch}
                    </Badge>
                    <Badge variant="light" color={repo.statusColor} size="sm" radius="sm">
                      {repo.statusIcon} {repo.status}
                    </Badge>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Group>

          {/* Summary bar */}
          <Group
            px="md"
            py={7}
            justify="space-between"
            wrap="nowrap"
            bg="var(--mantine-color-dark-6)"
            style={{ borderTop: '1px solid var(--mantine-color-dark-5)' }}
          >
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
              5 repositories
            </Text>
            <Group gap="md" wrap="nowrap" visibleFrom="sm">
              <Text size="xs" c="teal.4" style={{ fontFamily: 'monospace' }}>
                ✔ 2 clean
              </Text>
              <Text size="xs" c="orange.4" style={{ fontFamily: 'monospace' }}>
                ● 2 dirty
              </Text>
              <Text size="xs" c="blue.4" style={{ fontFamily: 'monospace' }}>
                ↑ 1 ahead
              </Text>
            </Group>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
              232 MB
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
