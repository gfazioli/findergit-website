'use client';

import { useState } from 'react';
import { IconFile, IconFolder, IconFolderOpen } from '@tabler/icons-react';
import { Box, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import classes from './FileTree.module.css';

type FolderProps = {
  name: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
};

type FileProps = {
  name: React.ReactNode;
};

export function FileTreeFolder({ name, defaultOpen = false, children }: FolderProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box>
      <UnstyledButton className={classes.row} onClick={() => setOpen(!open)}>
        <Group gap={6} wrap="nowrap">
          {open ? (
            <IconFolderOpen size={16} stroke={1.5} className={classes.icon} />
          ) : (
            <IconFolder size={16} stroke={1.5} className={classes.icon} />
          )}
          <Text component="div" size="sm">
            {name}
          </Text>
        </Group>
      </UnstyledButton>
      {/* display-none, not Mantine's default Activity: a closed folder's names stay in the served HTML */}
      <Collapse expanded={open} keepMountedMode="display-none">
        <Box className={classes.children}>{children}</Box>
      </Collapse>
    </Box>
  );
}

export function FileTreeFile({ name }: FileProps) {
  return (
    <Group gap={6} wrap="nowrap" className={classes.row}>
      <IconFile size={16} stroke={1.5} className={classes.icon} />
      <Text component="div" size="sm">
        {name}
      </Text>
    </Group>
  );
}

export function FileTreeRoot({ children }: { children: React.ReactNode }) {
  return <Box className={classes.tree}>{children}</Box>;
}
