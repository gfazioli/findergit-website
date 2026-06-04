'use client';

import { Navbar } from 'nextra-theme-docs';
import { Button, Group, Text } from '@mantine/core';
import { IconHeartFilled } from '@tabler/icons-react';
import { ColorSchemeControl } from '../ColorSchemeControl/ColorSchemeControl';
import { Logo } from '../Logo/Logo';
import { MantineNextraThemeObserver } from '../MantineNextraThemeObserver/MantineNextraThemeObserver';

export const MantineNavBar = () => {
  return (
    <>
      <MantineNextraThemeObserver />
      <Navbar
        logo={
          <Group align="center" gap={8}>
            <Logo />
            <Text size="lg" fw={600} visibleFrom="lg">
              FinderGit
            </Text>
          </Group>
        }
        // No project link — repo is private
      >
        {/*
          Wrap the navbar slot's content in a single Group instead of a
          Fragment. Nextra's Navbar runs its `children` through internal
          processing that doesn't add keys to fragmented siblings, which
          fires the React 19 "Each child in a list should have a unique
          key prop" warning. Passing one concrete element neutralises it.
        */}
        <Group gap="sm" wrap="nowrap">
          <ColorSchemeControl />
          <Button
            component="a"
            href="#sponsors"
            size="sm"
            radius="xl"
            variant="gradient"
            gradient={{ from: 'pink', to: 'grape' }}
            leftSection={<IconHeartFilled size={14} />}
          >
            Sponsor
          </Button>
        </Group>
      </Navbar>
    </>
  );
};
