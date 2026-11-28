'use client';

import { useEffect, useRef, useState } from 'react';
import { Tabs as MantineTabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { panelIndexOf, targetFromHash } from '@/lib/docs/tab-hash';

export interface TabsClientProps {
  items: React.ReactNode[];
  defaultIndex: number;
  /** One node per tab, in the order of `items` */
  panels: React.ReactNode[];
}

const PANEL_ATTRIBUTE = 'data-docs-tab-panel';

/**
 * The tabs themselves. Every panel is in the served HTML (`display: none` while closed), so a
 * heading inside a closed panel has an id and a table-of-contents entry but cannot be scrolled
 * to: this opens the panel that holds the target of `location.hash`, on mount, when the hash
 * changes and when a link to a `#anchor` is followed (the same hash twice does not change it),
 * then scrolls the target into view.
 */
export function TabsClient({ items, defaultIndex, panels }: TabsClientProps) {
  const [value, setValue] = useState(String(defaultIndex));
  const rootRef = useRef<HTMLDivElement>(null);
  // The target to scroll to, and the panel that must be showing first.
  const pendingScroll = useRef<{ target: HTMLElement; value: string } | null>(null);

  useEffect(() => {
    const reveal = (hash: string) => {
      const root = rootRef.current;
      const target = targetFromHash(hash);
      if (!root || !target) {
        return;
      }
      const panelElements = Array.from(root.querySelectorAll(`:scope > [${PANEL_ATTRIBUTE}]`));
      const index = panelIndexOf(panelElements, target);
      if (index === -1) {
        return;
      }
      const next = String(index);
      setValue((current) => {
        if (current !== next) {
          // Closed until this panel commits: the browser could not scroll to it, so do it once shown.
          pendingScroll.current = { target, value: next };
        }
        return next;
      });
    };

    const onHashChange = () => reveal(window.location.hash);
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (anchor) {
        reveal(anchor.getAttribute('href') ?? '');
      }
    };

    reveal(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    const pending = pendingScroll.current;
    // Only once the panel that holds the target is the committed one. On mount React may run the
    // state updater above eagerly, so the target is already pending when this effect first runs,
    // with the default panel still showing and the target hidden: scrolling then does nothing.
    if (pending && pending.value === value) {
      pendingScroll.current = null;
      pending.target.scrollIntoView();
    }
  }, [value]);

  return (
    <MantineTabs
      ref={rootRef}
      value={value}
      onChange={(next) => next !== null && setValue(next)}
      keepMountedMode="display-none"
      my="md"
      variant="outline"
      radius="md"
    >
      <TabsList>
        {items.map((item, index) => (
          <TabsTab key={index} value={String(index)}>
            {item}
          </TabsTab>
        ))}
      </TabsList>
      {panels.map((panel, index) => (
        <TabsPanel key={index} value={String(index)} pt="sm" {...{ [PANEL_ATTRIBUTE]: index }}>
          {panel}
        </TabsPanel>
      ))}
    </MantineTabs>
  );
}
