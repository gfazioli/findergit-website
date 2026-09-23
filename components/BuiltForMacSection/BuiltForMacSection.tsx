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
    <Box pos="relative" py={80} className="fg-feather" style={{ overflow: 'hidden' }}>
      {/*
        Aurora + Mesh evoke the Sequoia/Tahoe wallpaper aesthetic that
        ships with current macOS releases — the section is literally
        called "Built for macOS", so leaning into the macOS-native
        atmospheric vibe rather than a generic wash makes the message
        land. Colours from the icon: the Finder's sky and blue, the
        plate's lilac. Feathered at both edges like every wash here.
      */}
      <Scene lazy>
        <Scene.Mesh
          stops={[
            { color: '#609BE3', position: '15% 30%', spread: 60 },
            { color: '#7DC3EB', position: '85% 65%', spread: 55 },
            { color: '#C1C5F5', position: '50% 55%', spread: 70 },
          ]}
          opacity={0.14}
        />
        <Scene.Aurora
          colors={['#7DC3EB', '#609BE3', '#C1C5F5']}
          bands={3}
          position="top"
          opacity={0.16}
        />
        <Scene.Noise opacity={0.018} />
      </Scene>
      <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
        <Stack align="center" gap="md">
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="findergit.3">
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
