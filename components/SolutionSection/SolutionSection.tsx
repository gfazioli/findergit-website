'use client';

import { IconFolder } from '@tabler/icons-react';
import {
  Badge,
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

const repos = [
  {
    name: 'my-ios-app',
    branch: 'main',
    branchColor: 'green',
    status: 'Clean',
    statusColor: 'teal',
    statusIcon: '\u2714',
    dirty: false,
  },
  {
    name: 'api-server',
    branch: 'develop',
    branchColor: 'gray',
    status: '3 changes',
    statusColor: 'orange',
    statusIcon: '\u25CF',
    dirty: true,
  },
  {
    name: 'design-system',
    branch: 'feat/tokens',
    branchColor: 'violet',
    status: '2 ahead',
    statusColor: 'blue',
    statusIcon: '\u2191',
    dirty: false,
  },
  {
    name: 'landing-page',
    branch: 'main',
    branchColor: 'green',
    status: 'Clean',
    statusColor: 'teal',
    statusIcon: '\u2714',
    dirty: false,
  },
  {
    name: 'cli-tools',
    branch: 'v2.0',
    branchColor: 'yellow',
    status: '1 change',
    statusColor: 'orange',
    statusIcon: '\u25CF',
    dirty: true,
  },
];

export function SolutionSection() {
  return (
    <Box
      py={80}
      style={{
        backgroundColor: 'var(--mantine-color-dark-8)',
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="md" mb={48}>
          <Text
            size="sm"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: 3 }}
            c="orange"
          >
            The Solution
          </Text>
          <Title
            order={2}
            ta="center"
            fz={{ base: 32, sm: 42 }}
            fw={900}
            c="white"
          >
            One window. All your repos. Always live.
          </Title>
        </Stack>

        {/* Mock window */}
        <Paper
          radius="lg"
          bg="var(--mantine-color-dark-7)"
          style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-dark-5)' }}
          maw={800}
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
                py="sm"
                style={{ borderBottom: '1px solid var(--mantine-color-dark-6)' }}
              >
                <Group gap="sm">
                  <IconFolder size={18} color="var(--mantine-color-dark-2)" />
                  <Text size="sm" c="gray.3" style={{ fontFamily: 'monospace' }}>
                    {repo.name}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Badge
                    variant="light"
                    color={repo.branchColor}
                    size="sm"
                    radius="sm"
                  >
                    {repo.branch}
                  </Badge>
                  <Badge
                    variant={repo.dirty ? 'light' : 'light'}
                    color={repo.statusColor}
                    size="sm"
                    radius="sm"
                  >
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
