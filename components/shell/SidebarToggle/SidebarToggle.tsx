'use client';

import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { useOs } from '@mantine/hooks';

export interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Where this one sits: SiteShell hides the header's and moves the focus between the two by it */
  placement?: 'header' | 'sidebar';
}

/**
 * Shows or hides the docs sidebar on desktop, as ⌘B / Ctrl+B does. Where it sits is the site's
 * choice, `config.docs.sidebar.toggle`: in the header, or at the foot of the sidebar (see SiteShell).
 */
export function SidebarToggle({ collapsed, onToggle, placement }: SidebarToggleProps) {
  const shortcut = useOs() === 'macos' ? '⌘B' : 'Ctrl+B';
  const label = collapsed ? 'Show the sidebar' : 'Hide the sidebar';

  return (
    <Tooltip label={`${label} (${shortcut})`}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        visibleFrom="md"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        data-sidebar-toggle={placement}
      >
        {collapsed ? (
          <IconLayoutSidebarLeftExpand size={20} stroke={1.5} />
        ) : (
          <IconLayoutSidebarLeftCollapse size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
