'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconFileText, IconHash, IconSearch } from '@tabler/icons-react';
import { Group, Kbd, Loader, Mark, Stack, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Spotlight } from '@mantine/spotlight';
import { loadPagefind, toRouterUrl, type PagefindResultData } from './pagefind';
import { selectFirstOnEnter } from './select-first-on-enter';
import classes from './DocsSearch.module.css';

const MAX_PAGES = 8;

/** Pagefind wraps matches in `<mark>`; render them with Mantine's `Mark`, never as raw HTML. */
function Excerpt({ html }: { html: string }) {
  const parts = html.split(/(<mark>.*?<\/mark>)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('<mark>') ? (
          <Mark key={index}>{decode(part.slice(6, -7))}</Mark>
        ) : (
          decode(part)
        )
      )}
    </>
  );
}

function decode(text: string) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; results: PagefindResultData[] }
  | { status: 'unavailable' };

/**
 * The docs search: Mantine's `Spotlight` (⌘K or `/`) over the Pagefind index.
 * Each page is a group; its matching sections are the actions, with the matched words marked.
 */
export function DocsSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query.trim(), 200);
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    if (debounced.length < 2) {
      setState({ status: 'idle' });
      return;
    }
    let current = true;
    setState({ status: 'loading' });
    loadPagefind()
      .then(async (pagefind) => {
        const search = await pagefind.search(debounced);
        const results = await Promise.all(
          search.results.slice(0, MAX_PAGES).map((result) => result.data())
        );
        if (current) {
          setState({ status: 'done', results });
        }
      })
      .catch(() => {
        if (current) {
          setState({ status: 'unavailable' });
        }
      });
    return () => {
      current = false;
    };
  }, [debounced]);

  const go = (url: string) => router.push(toRouterUrl(url));

  return (
    <Spotlight.Root
      query={query}
      onQueryChange={setQuery}
      shortcut={['mod + K', '/']}
      scrollable
      maxHeight={480}
      size="lg"
    >
      <Spotlight.Search
        placeholder="Search documentation..."
        onKeyDown={selectFirstOnEnter}
        leftSection={
          state.status === 'loading' ? <Loader size={18} /> : <IconSearch size={18} stroke={1.5} />
        }
        rightSection={<Kbd size="xs">ESC</Kbd>}
        rightSectionPointerEvents="none"
        rightSectionWidth={60}
      />
      <Spotlight.ActionsList>
        {state.status === 'unavailable' && (
          <Spotlight.Empty>
            The search index is built by <code>yarn build</code>: run it once, then search again.
          </Spotlight.Empty>
        )}
        {state.status === 'done' && state.results.length === 0 && (
          <Spotlight.Empty>Nothing found for “{debounced}”</Spotlight.Empty>
        )}
        {state.status === 'done' &&
          state.results.map((page) => {
            // The page's own heading comes back as a section too: the page action covers it.
            const sections = page.sub_results.filter(
              (sub) => sub.url !== page.url && sub.title !== page.meta.title
            );
            return (
              <Spotlight.ActionsGroup key={page.url} label={page.meta.title ?? page.url}>
                <Spotlight.Action onClick={() => go(page.url)} className={classes.action}>
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <IconFileText size={18} stroke={1.5} className={classes.icon} />
                    <Stack gap={2} miw={0}>
                      <Text size="sm" fw={600}>
                        {page.meta.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        <Excerpt html={page.excerpt} />
                      </Text>
                    </Stack>
                  </Group>
                </Spotlight.Action>
                {sections.slice(0, 3).map((section) => (
                  <Spotlight.Action
                    key={section.url}
                    onClick={() => go(section.url)}
                    className={classes.action}
                    pl="xl"
                  >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <IconHash size={16} stroke={1.5} className={classes.icon} />
                      <Stack gap={2} miw={0}>
                        <Text size="sm" fw={500}>
                          {section.title}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          <Excerpt html={section.excerpt} />
                        </Text>
                      </Stack>
                    </Group>
                  </Spotlight.Action>
                ))}
              </Spotlight.ActionsGroup>
            );
          })}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
