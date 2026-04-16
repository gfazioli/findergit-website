'use client';

import { Group, Kbd, Table, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface Shortcut {
  keys: string[];
  action: string;
}

interface ShortcutsTableProps {
  shortcuts: Shortcut[];
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <Group gap={4} wrap="nowrap">
      {keys.map((key, i) => (
        <span key={i}>
          {i > 0 && (
            <Text component="span" size="xs" c="dimmed" mx={2}>
              +
            </Text>
          )}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </Group>
  );
}

export function ShortcutsTable({ shortcuts }: ShortcutsTableProps) {
  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={200}>Shortcut</Table.Th>
          <Table.Th>Action</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {shortcuts.map((shortcut, i) => (
          <Table.Tr key={i}>
            <Table.Td>
              <ShortcutKeys keys={shortcut.keys} />
            </Table.Td>
            <Table.Td>{shortcut.action}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
