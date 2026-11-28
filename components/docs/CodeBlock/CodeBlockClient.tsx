'use client';

import { useMemo } from 'react';
import {
  IconBrandCss3,
  IconBrandReact,
  IconBrandTypescript,
  IconFileCode,
  IconJson,
  IconMarkdown,
  IconTerminal2,
} from '@tabler/icons-react';
import {
  CodeHighlight,
  CodeHighlightAdapterProvider,
  CodeHighlightTabs,
  type CodeHighlightAdapter,
} from '@mantine/code-highlight';
import classes from './CodeBlock.module.css';

export interface CodeBlockClientProps {
  code: string;
  /** Inner HTML of `<code>`, highlighted at build time; `null` renders the code as plain text */
  html: string | null;
  language?: string;
  fileName?: string;
  withLineNumbers?: boolean;
  /** Opens collapsed, with an expand button */
  collapsible?: boolean;
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const props = { size: 16, stroke: 1.5 };
  switch (extension) {
    case 'ts':
    case 'mts':
      return <IconBrandTypescript {...props} color="var(--mantine-color-blue-6)" />;
    case 'tsx':
    case 'jsx':
      return <IconBrandReact {...props} color="var(--mantine-color-cyan-6)" />;
    case 'css':
    case 'scss':
      return <IconBrandCss3 {...props} color="var(--mantine-color-violet-6)" />;
    case 'json':
      return <IconJson {...props} color="var(--mantine-color-yellow-7)" />;
    case 'md':
    case 'mdx':
      return <IconMarkdown {...props} />;
    case 'sh':
    case 'zsh':
    case 'bash':
      return <IconTerminal2 {...props} />;
    default:
      return <IconFileCode {...props} />;
  }
}

/**
 * Mantine's `CodeHighlight`, fed with HTML highlighted at build time.
 *
 * `CodeHighlight` asks an adapter to highlight its code. This adapter has no context to load and
 * returns the precomputed HTML synchronously, so the server render already holds the coloured
 * code and no highlighter ever reaches the browser. One adapter per block, since each block
 * carries its own HTML.
 */
export function CodeBlockClient({
  code,
  html,
  language,
  fileName,
  withLineNumbers,
  collapsible,
}: CodeBlockClientProps) {
  const adapter = useMemo<CodeHighlightAdapter>(
    () => ({
      getHighlighter: () => () =>
        html === null
          ? { highlightedCode: code, isHighlighted: false }
          : { highlightedCode: html, isHighlighted: true },
    }),
    [code, html]
  );

  const shared = {
    withBorder: true,
    radius: 'md',
    withLineNumbers,
    withExpandButton: collapsible,
    defaultExpanded: !collapsible,
    maxCollapsedHeight: 320,
    className: classes.root,
    // Code is left out of the search index, as in Nextra (`search.codeblocks: false`).
    'data-pagefind-ignore': true,
  } as const;

  return (
    <CodeHighlightAdapterProvider adapter={adapter}>
      {fileName ? (
        <CodeHighlightTabs
          {...shared}
          code={[{ fileName, code, language }]}
          getFileIcon={getFileIcon}
        />
      ) : (
        <CodeHighlight {...shared} code={code} language={language} />
      )}
    </CodeHighlightAdapterProvider>
  );
}
