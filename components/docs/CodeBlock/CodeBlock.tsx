import { isValidElement } from 'react';
import { copyableCode } from '@/lib/docs/copyable-code';
import { highlightCode, normalizeCode } from '@/lib/mdx/highlight';
import { CodeBlockClient } from './CodeBlockClient';

type PreProps = React.ComponentPropsWithoutRef<'pre'> & {
  'data-meta'?: string;
  'data-language'?: string;
};

/** Code blocks taller than this many lines open collapsed, with Mantine's expand button. */
const COLLAPSE_AFTER_LINES = 30;

function codeText(children: React.ReactNode): string {
  if (isValidElement<{ children?: React.ReactNode }>(children)) {
    const inner = children.props.children;
    return typeof inner === 'string' ? inner : Array.isArray(inner) ? inner.join('') : '';
  }
  return typeof children === 'string' ? children : '';
}

/**
 * Reads the fence meta Nextra understands: `filename="…"` (or `title="…"`) for a file tab and
 * `showLineNumbers`. `copy` needs nothing: every block has Mantine's copy button. `{4}` is handled
 * by the highlighter.
 */
function parseMeta(meta: string | undefined) {
  const fileName = meta?.match(/(?:filename|title)="([^"]*)"/)?.[1];
  const withLineNumbers = /\bshowLineNumbers\b/.test(meta ?? '');
  return { fileName, withLineNumbers };
}

/**
 * The `pre` of an MDX code block: highlighted here, on the server at build time, and rendered by
 * Mantine's `CodeHighlight` (or `CodeHighlightTabs` when the block names a file).
 */
export async function CodeBlock({ children, ...props }: PreProps) {
  const language = props['data-language'];
  const meta = props['data-meta'];
  const code = normalizeCode(codeText(children));
  const html = await highlightCode(code, language, meta);
  const { fileName, withLineNumbers } = parseMeta(meta);

  return (
    <CodeBlockClient
      code={copyableCode(code, language)}
      html={html}
      language={language}
      fileName={fileName}
      withLineNumbers={withLineNumbers}
      collapsible={code.split('\n').length > COLLAPSE_AFTER_LINES}
    />
  );
}
