'use client';

import { IconSearch } from '@tabler/icons-react';
import cx from 'clsx';
import { Group, Kbd, Text, UnstyledButton } from '@mantine/core';
import { spotlight } from '@mantine/spotlight';
import classes from './SearchTrigger.module.css';

type SearchTriggerProps = {
  /** Renders as a full-width search box (sidebar style) instead of a compact navbar button */
  fullWidth?: boolean;
};

/**
 * Search-box-like button that opens the docs search Spotlight.
 */
export function SearchTrigger({ fullWidth = false }: SearchTriggerProps) {
  return (
    <UnstyledButton
      className={cx(classes.trigger, fullWidth && classes.fullWidth)}
      onClick={spotlight.open}
      aria-label="Search documentation"
    >
      <Group gap="xs" wrap="nowrap" justify="space-between" w="100%">
        <Group gap="xs" wrap="nowrap">
          <IconSearch size={16} stroke={1.5} />
          <Text size="sm" c="dimmed" visibleFrom={fullWidth ? undefined : 'md'}>
            Search
          </Text>
        </Group>
        <Kbd size="xs" visibleFrom={fullWidth ? undefined : 'md'}>
          ⌘K
        </Kbd>
      </Group>
    </UnstyledButton>
  );
}
