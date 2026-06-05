'use client';

import { IconFolder, IconShieldHalfFilled, IconStarFilled } from '@tabler/icons-react';
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
          maw={860}
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
              FinderGit — ~/Developer
            </Text>
          </Group>

          {/* Repo list */}
          <Stack gap={0} px="lg" py="md">
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
                  <Text size="sm" c="gray.3" style={{ fontFamily: 'monospace' }}>
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
        </Paper>
      </Container>
    </Box>
  );
}
