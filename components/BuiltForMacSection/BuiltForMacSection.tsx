'use client';

import { IconEye, IconKeyboard, IconMenu2, IconCpu, IconDeviceDesktop } from '@tabler/icons-react';
import { Badge, Box, Container, Group, Stack, Text, Title } from '@mantine/core';
import { revealItem, revealScope } from '@/components/Motion/Reveal';
import { ScrollNumber } from '@/components/Motion/ScrollNumber';
import { useReveal } from '@/components/Motion/useReveal';

const techPills = [
  { label: 'Quick Look', icon: IconEye },
  { label: 'Keyboard Shortcuts', icon: IconKeyboard },
  { label: 'Context Menus', icon: IconMenu2 },
  { label: 'Universal Binary', icon: IconDeviceDesktop },
  { label: 'Apple Silicon', icon: IconCpu },
  { label: 'Intel Support', icon: IconDeviceDesktop },
];

export function BuiltForMacSection() {
  // One reveal for the band: the heading rises, the "100" rolls, the pills pop
  // one after another and the closing line follows them.
  const reveal = useReveal<HTMLDivElement>();

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
        <Stack ref={reveal.ref} {...revealScope(reveal)} align="center" gap="md">
          <Text
            {...revealItem('rise')}
            size="sm"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: 3 }}
            c="findergit.3"
          >
            Built for macOS
          </Text>
          <Title
            {...revealItem('rise', 80)}
            order={2}
            ta="center"
            fz={{ base: 32, sm: 42 }}
            fw={900}
          >
            <ScrollNumber value="100" delay={250} />% native. Fast. Familiar. Yours.
          </Title>

          <Group justify="center" gap="sm" mt="lg" maw={700}>
            {techPills.map((pill, i) => (
              <Badge
                key={pill.label}
                {...revealItem('pop', 300 + i * 70)}
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

          <Text
            {...revealItem('rise', 300 + techPills.length * 70)}
            c="dimmed"
            ta="center"
            size="lg"
            maw={600}
            mt="lg"
          >
            No Electron. No web views. A real macOS app that feels like it belongs on your Mac.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
