'use client';

import { Navbar } from 'nextra-theme-docs';
import { Group, Text } from '@mantine/core';
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
        <>
          <ColorSchemeControl />
          <iframe
            src="https://github.com/sponsors/gfazioli/button"
            title="Sponsor gfazioli"
            height="32"
            width="114"
            style={{ border: 0 }}
          />
        </>
      </Navbar>
    </>
  );
};
