import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import {
  IconBook2,
  IconRocket,
  IconFolders,
  IconLayoutSidebarRight,
  IconLayoutGrid,
  IconUserCircle,
  IconBrandGithub,
  IconGitBranch,
  IconShieldHalfFilled,
  IconDatabase,
  IconSparkles,
  IconGitCompare,
  IconSettings,
  IconKeyboard,
  IconHelpCircle,
} from '@tabler/icons-react';

// Sidebar entry with a leading icon. The icon inherits `currentColor`, so it
// tracks the link's active/hover colour automatically — which is why the
// label stays a bare string (a Mantine `Text` would impose its own colour
// token and break that inheritance). Kept as a small helper so every page
// entry reads as `nav(Icon, 'Label')`.
function nav(Icon: typeof IconBook2, label: string): { title: ReactNode } {
  return {
    title: (
      <Group component="span" gap={8} wrap="nowrap" align="center">
        <Icon size={16} stroke={1.8} />
        {label}
      </Group>
    ),
  };
}

export default {
  index: nav(IconBook2, 'Introduction'),
  '---get-started': { type: 'separator', title: 'Get Started' },
  'getting-started': nav(IconRocket, 'Getting Started'),
  'file-browser': nav(IconFolders, 'File Browser'),
  'detail-panel': nav(IconLayoutSidebarRight, 'Detail Panel'),
  '---dashboards': { type: 'separator', title: 'Dashboards' },
  overview: nav(IconLayoutGrid, 'Overview'),
  account: nav(IconUserCircle, 'Account'),
  '---guides': { type: 'separator', title: 'Guides' },
  'github-integration': nav(IconBrandGithub, 'GitHub Integration'),
  'git-actions': nav(IconGitBranch, 'Git Actions'),
  'repo-trust': nav(IconShieldHalfFilled, 'Repo Trust'),
  'repo-maintenance': nav(IconDatabase, 'Repo Maintenance'),
  'ai-commit-messages': nav(IconSparkles, 'AI Commit Messages'),
  'diff-viewer': nav(IconGitCompare, 'Diff Viewer'),
  '---reference': { type: 'separator', title: 'Reference' },
  settings: nav(IconSettings, 'Settings'),
  'keyboard-shortcuts': nav(IconKeyboard, 'Keyboard Shortcuts'),
  '---resources': { type: 'separator', title: 'Resources' },
  faq: nav(IconHelpCircle, 'FAQ'),
  'release-notes': '',
};
