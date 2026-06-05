import type { ReactNode } from 'react';
import {
  IconBook2,
  IconRocket,
  IconFolders,
  IconLayoutSidebarRight,
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
// tracks the link's active/hover colour automatically. Kept as a small
// helper so every page entry reads as `nav(Icon, 'Label')`.
function nav(Icon: typeof IconBook2, label: string): { title: ReactNode } {
  return {
    title: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} stroke={1.8} style={{ flexShrink: 0 }} />
        {label}
      </span>
    ),
  };
}

export default {
  index: nav(IconBook2, 'Introduction'),
  '---get-started': { type: 'separator', title: 'Get Started' },
  'getting-started': nav(IconRocket, 'Getting Started'),
  'file-browser': nav(IconFolders, 'File Browser'),
  'detail-panel': nav(IconLayoutSidebarRight, 'Detail Panel'),
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
