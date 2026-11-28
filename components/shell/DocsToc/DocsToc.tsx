'use client';

import { useEffect, useRef, useState } from 'react';
import { IconArrowUp, IconEdit, IconListSearch } from '@tabler/icons-react';
import { Anchor, Button, Divider, Group, Stack, TableOfContents, Text } from '@mantine/core';
import { TOC_REFRESH_EVENT } from '@/lib/docs/routes';
import classes from './DocsToc.module.css';

/**
 * The headings the table of contents lists: `h2`–`h4` of the article, plus any element marked
 * `data-toc-entry` (with `data-toc-depth` and `data-toc-value`), which is how the release notes
 * add one entry per release.
 */
const SELECTOR =
  '[data-docs-article] :is(h2, h3, h4)[id], [data-docs-article] [data-toc-entry][id]';

function depthOf(element: HTMLElement) {
  return Number(element.dataset.tocDepth ?? element.tagName.slice(1));
}

function valueOf(element: HTMLElement) {
  return element.dataset.tocValue ?? element.textContent ?? '';
}

export interface DocsTocProps {
  /** "Edit this page" link, when the site sets `docs.editUrlBase` */
  editUrl?: string;
}

/**
 * Mantine's `TableOfContents`, reading the headings straight from the rendered page with
 * `use-scroll-spy`: no table of contents is computed at build time, and the active entry follows
 * the scroll. Remounted on every route (the shell keys it by pathname).
 */
export function DocsToc({ editUrl }: DocsTocProps) {
  const reinitializeRef = useRef<() => void>(() => {});
  const [hasHeadings, setHasHeadings] = useState(false);

  useEffect(() => {
    const refresh = () => {
      reinitializeRef.current();
      setHasHeadings(document.querySelector(SELECTOR) !== null);
    };
    refresh();
    window.addEventListener(TOC_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(TOC_REFRESH_EVENT, refresh);
  }, []);

  return (
    <Stack gap="md" className={classes.root}>
      {hasHeadings && (
        <nav aria-label="Table of contents">
          <Group gap={6} mb="xs">
            <IconListSearch size={14} stroke={1.5} />
            <Text size="xs" fw={700} c="dimmed">
              On this page
            </Text>
          </Group>
          <TableOfContents
            variant="light"
            size="sm"
            radius="sm"
            minDepthToOffset={2}
            depthOffset={14}
            scrollSpyOptions={{
              selector: SELECTOR,
              getDepth: depthOf,
              getValue: valueOf,
              offset: 90,
            }}
            getControlProps={({ data }) => ({
              component: 'a',
              href: `#${data.id}`,
              children: data.value,
            })}
            reinitializeRef={reinitializeRef}
            classNames={{ control: classes.control }}
          />
        </nav>
      )}

      {(editUrl || hasHeadings) && <Divider />}

      <Stack gap={6} align="flex-start">
        {editUrl && (
          <Anchor href={editUrl} target="_blank" rel="noopener noreferrer" size="xs" c="dimmed">
            <Group gap={6} wrap="nowrap">
              <IconEdit size={14} stroke={1.5} />
              Edit this page on GitHub
            </Group>
          </Anchor>
        )}
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          leftSection={<IconArrowUp size={14} stroke={1.5} />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={classes.top}
        >
          Scroll to top
        </Button>
      </Stack>
    </Stack>
  );
}
