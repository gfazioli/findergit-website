import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import {
  IconBook2,
  IconRocket,
  IconLayoutList,
  IconFolders,
  IconLayoutSidebarRight,
  IconLayoutGrid,
  IconUserCircle,
  IconBrandGithub,
  IconCloudDownload,
  IconGitBranch,
  IconShieldHalfFilled,
  IconDatabase,
  IconSparkles,
  IconGitCompare,
  IconSettings,
  IconKeyboard,
  IconHelpCircle,
} from '@tabler/icons-react';

// Sidebar entry with a leading icon, tinted with its hue at shade 4: shade 6
// is drawn for a light page and sank into the night (grape-6 is under 4:1 on
// it). On the active row app/global.css hands the stroke back to the row's
// white text. The label stays a bare string so it keeps Nextra's own
// active/hover colour (a Mantine `Text` would impose its own token). Kept as
// a small helper so every page entry reads as `nav(Icon, 'Label')`.
function nav(Icon: typeof IconBook2, label: string, color?: string): { title: ReactNode } {
  return {
    title: (
      <Group component="span" gap={8} wrap="nowrap" align="center">
        <Icon
          size={16}
          stroke={1.8}
          color={color ? `var(--mantine-color-${color}-4)` : undefined}
        />
        {label}
      </Group>
    ),
  };
}

export default {
  index: nav(IconBook2, 'Introduction', 'blue'),
  '---get-started': { type: 'separator', title: 'Get Started' },
  'getting-started': nav(IconRocket, 'Getting Started', 'orange'),
  'repository-list': nav(IconLayoutList, 'Repository List', 'findergit'),
  'file-browser': nav(IconFolders, 'File Browser', 'yellow'),
  'detail-panel': nav(IconLayoutSidebarRight, 'Detail Panel', 'grape'),
  '---dashboards': { type: 'separator', title: 'Dashboards' },
  overview: nav(IconLayoutGrid, 'Overview', 'blue'),
  account: nav(IconUserCircle, 'Account', 'cyan'),
  '---guides': { type: 'separator', title: 'Guides' },
  'github-integration': nav(IconBrandGithub, 'GitHub Integration'),
  'clone-repositories': nav(IconCloudDownload, 'Clone Repositories', 'teal'),
  'git-actions': nav(IconGitBranch, 'Git Actions', 'green'),
  'repo-trust': nav(IconShieldHalfFilled, 'Repo Trust', 'orange'),
  'repo-maintenance': nav(IconDatabase, 'Repo Maintenance', 'grape'),
  'ai-commit-messages': nav(IconSparkles, 'AI Commit Messages', 'violet'),
  'diff-viewer': nav(IconGitCompare, 'Diff Viewer', 'teal'),
  '---reference': { type: 'separator', title: 'Reference' },
  settings: nav(IconSettings, 'Settings'),
  'keyboard-shortcuts': nav(IconKeyboard, 'Keyboard Shortcuts'),
  '---resources': { type: 'separator', title: 'Resources' },
  faq: nav(IconHelpCircle, 'FAQ', 'blue'),
  'release-notes': '',
};
