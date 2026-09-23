'use client';

import { IconEye, IconKeyboard, IconMenu2, IconCpu, IconDeviceDesktop } from '@tabler/icons-react';
import { Badge, Box, Container, Group, Stack, Text, Title } from '@mantine/core';

const techPills = [
  { label: 'Quick Look', icon: IconEye },
  { label: 'Keyboard Shortcuts', icon: IconKeyboard },
  { label: 'Context Menus', icon: IconMenu2 },
  { label: 'Universal Binary', icon: IconDeviceDesktop },
  { label: 'Apple Silicon', icon: IconCpu },
  { label: 'Intel Support', icon: IconDeviceDesktop },
];

export function BuiltForMacSection() {
  return (
    <Box
      pos="relative"
      py={80}
      className="fg-feather"
      style={{
        /*
          A fixed wash, painted once, lit from above like a macOS wallpaper:
          the Finder's sky across the top, its blue on the left and the
          plate's lilac on the right. Feathered at both edges like every
          wash here.
        */
        background:
          'radial-gradient(70% 55% at 50% 0%, rgb(125 195 235 / 14%), transparent 70%), radial-gradient(40% 55% at 12% 40%, rgb(96 155 227 / 10%), transparent 70%), radial-gradient(40% 55% at 88% 65%, rgb(193 197 245 / 9%), transparent 70%)',
      }}
    >
      <Container size="lg" pos="relative" style={{ zIndex: 1 }}>
        <Stack align="center" gap="md">
          <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: 3 }} c="findergit.3">
            Built for macOS
          </Text>
          <Title order={2} ta="center" fz={{ base: 32, sm: 42 }} fw={900}>
            100% native. Fast. Familiar. Yours.
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
