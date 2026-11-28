import { Children, isValidElement } from 'react';
import { Blockquote } from '@mantine/core';
import { Callout, type CalloutType } from './Callout';

const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/;

const TITLES: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

function textOf(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join('');
  }
  if (isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return '';
}

/**
 * The MDX `blockquote`. GitHub's alert syntax becomes a `Callout`, titled as GitHub titles it:
 *
 * ```md
 * > [!NOTE]
 * >
 * > Useful information that users should know.
 * ```
 *
 * Any other quote is Mantine's `Blockquote`.
 */
export function GitHubAlert(props: React.ComponentPropsWithoutRef<'blockquote'>) {
  const children = Children.toArray(props.children).filter(
    (child) => !(typeof child === 'string' && child.trim() === '')
  );
  const [first, ...rest] = children;
  const marker = textOf(first).trim().match(ALERT);

  if (marker) {
    const type = marker[1].toLowerCase() as CalloutType;
    return (
      <Callout type={type} title={TITLES[type]}>
        {rest}
      </Callout>
    );
  }

  return (
    <Blockquote my="md" color="gray" p="md">
      {props.children}
    </Blockquote>
  );
}
