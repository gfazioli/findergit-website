import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconMoodSmile,
  IconPhoto,
  IconSunMoon,
  IconVideo,
} from '@tabler/icons-react';
import { SimpleGrid, Stack, Text, Title } from '@mantine/core';
import classes from './Goodies.module.css';

/**
 * What the pack holds, one card per kind of thing. The words match the pack's
 * own Read Me (`pack/Read Me.txt` in the pack's repository): change them
 * together. The emoji are listed before they are drawn, and the pack's
 * `goodies.json` has no emoji file yet.
 */
const INSIDE = [
  {
    icon: IconDeviceDesktop,
    accent: 'var(--fg-sky)',
    title: 'Two screen savers',
    text: 'FinderGit Mainline, a flight over an endless commit graph, and FinderGit Streak, a wall of contribution calendars that fills in. Drawn by your Mac’s graphics processor, with a preview app to try both first.',
  },
  {
    icon: IconPhoto,
    accent: 'var(--fg-blue)',
    title: 'Five wallpapers',
    text: 'Branch Lines, Commit Galaxy, Contribution City, Merge Rivers and Christmas, sized for Mac 5K, Mac 4K and MacBook 16:10 screens.',
  },
  {
    icon: IconSunMoon,
    accent: 'var(--fg-lilac)',
    title: 'Five dynamic wallpapers',
    text: 'Every design again, turning from day to night with your Mac’s Light and Dark appearance.',
  },
  {
    icon: IconDeviceMobile,
    accent: 'var(--fg-green)',
    title: 'Five iPhone wallpapers',
    text: 'All five designs, sized for the iPhone’s screen.',
  },
  {
    icon: IconVideo,
    accent: 'var(--fg-orange)',
    title: 'Five video-call backgrounds',
    text: 'Every design at 1920×1080, for the calls you take.',
  },
  {
    icon: IconMoodSmile,
    accent: 'var(--fg-yellow)',
    title: 'Pixel folder emoji',
    text: 'A small pixel folder character standing, waving and walking, for your chats and workspaces.',
  },
];

export function GoodiesInside() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
      {INSIDE.map((item) => (
        <div
          key={item.title}
          className={classes.card}
          style={{ '--card-color': item.accent } as never}
        >
          <Stack gap="md" align="flex-start">
            <span className={classes.icon} aria-hidden>
              <item.icon size={24} />
            </span>
            <Title order={3} fz="lg" fw={700}>
              {item.title}
            </Title>
            <Text c="dimmed" size="sm">
              {item.text}
            </Text>
          </Stack>
        </div>
      ))}
    </SimpleGrid>
  );
}
