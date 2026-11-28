import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBulb,
  IconExclamationCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Alert } from '@mantine/core';
import classes from './Callout.module.css';

/**
 * Nextra's types (`default`, `info`, `warning`, `error`, `important`) and GitHub's alert types
 * (`note`, `tip`, `caution`), so pages written for either keep working.
 */
export type CalloutType =
  | 'default'
  | 'info'
  | 'warning'
  | 'error'
  | 'important'
  | 'note'
  | 'tip'
  | 'caution';

export interface CalloutProps {
  type?: CalloutType;
  /** Replaces the type's icon: an emoji (`"💡"`) or any node (`<IconBrandGithub />`) */
  emoji?: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
}

const ICON_SIZE = 20;

const TYPES: Record<CalloutType, { color: string; icon: React.ReactNode }> = {
  default: { color: 'teal', icon: <IconBulb size={ICON_SIZE} /> },
  tip: { color: 'teal', icon: <IconBulb size={ICON_SIZE} /> },
  info: { color: 'blue', icon: <IconInfoCircle size={ICON_SIZE} /> },
  note: { color: 'blue', icon: <IconInfoCircle size={ICON_SIZE} /> },
  important: { color: 'violet', icon: <IconExclamationCircle size={ICON_SIZE} /> },
  warning: { color: 'yellow', icon: <IconAlertTriangle size={ICON_SIZE} /> },
  error: { color: 'red', icon: <IconAlertOctagon size={ICON_SIZE} /> },
  caution: { color: 'red', icon: <IconAlertOctagon size={ICON_SIZE} /> },
};

/**
 * An admonition on Mantine's `Alert`: Nextra's `<Callout>` API, Mantine's look.
 */
export function Callout({ type = 'default', emoji, title, children }: CalloutProps) {
  const { color, icon } = TYPES[type] ?? TYPES.default;

  return (
    <Alert
      my="md"
      variant="light"
      color={color}
      radius="md"
      title={title}
      icon={emoji === undefined ? icon : <span className={classes.emoji}>{emoji}</span>}
      style={{ '--callout-color': `var(--mantine-color-${color}-filled)` } as React.CSSProperties}
      classNames={{ root: classes.root, title: classes.title, icon: classes.icon }}
    >
      {children}
    </Alert>
  );
}
