'use client';

import { Scene } from '@gfazioli/mantine-scene';
import {
  IconEye,
  IconKeyboard,
  IconMenu2,
  IconCpu,
  IconDeviceDesktop,
  IconCode,
} from '@tabler/icons-react';
import { Badge, Box, Container, Group, Stack, Text, Title } from '@mantine/core';

const techPills = [
  { label: 'SwiftUI', icon: IconCode },
  { label: 'Quick Look', icon: IconEye },
  { label: 'Keyboard Shortcuts', icon: IconKeyboard },
  { label: 'Context Menus', icon: IconMenu2 },
  { label: 'Universal Binary', icon: IconDeviceDesktop },
  { label: 'Apple Silicon', icon: IconCpu },
  { label: 'Intel Support', icon: IconDeviceDesktop },
];

export function BuiltForMacSection() {
  return (
    <Box pos="relative" py={80} style={{ overflow: 'hidden' }}>
      {/*
        Aurora + Mesh evoke the Sequoia/Tahoe wallpaper aesthetic that
        ships with current macOS releases — the section is literally
        called "Built for macOS", so leaning into the macOS-native
        atmospheric vibe rather than a generic wash makes the message
        land. Colors stay in the FinderGit blue/cyan/indigo brand
        family rather than Aurora's default green/teal.
      */}
      <Scene lazy>
        <Scene.Mesh
          stops={[
            { color: 'blue', position: '15% 25%', spread: 60 },
            { color: 'cyan', position: '85% 70%', spread: 60 },
            { color: 'indigo', position: '50% 55%', spread: 75 },
          ]}
          opacity={0.18}
        />
        <Scene.Aurora colors={['blue', 'cyan', 'indigo']} bands={3} position="top" opacity={0.22} />
        <Scene.Noise opacity={0.018} />
      </Scene>
      <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
        <Stack align="center" gap="md">
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="orange">
            Built for macOS
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
            100% native SwiftUI. Fast. Familiar. Yours.
          </Title>

          <Group justify="center" gap="sm" mt="lg" maw={700}>
            {techPills.map((pill) => (
              <Badge
                key={pill.label}
                size="xl"
                variant="light"
                color="gray"
                radius="xl"
                leftSection={<pill.icon size={16} />}
                styles={{
                  root: {
                    textTransform: 'none',
                    fontWeight: 500,
                  },
                }}
              >
                {pill.label}
              </Badge>
            ))}
          </Group>

          <Text c="dimmed" ta="center" size="lg" maw={600} mt="lg">
            No Electron. No web views. A real macOS app that feels like it belongs on your Mac.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
