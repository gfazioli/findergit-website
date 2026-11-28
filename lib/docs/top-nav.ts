import appMeta from '@/app/_meta';
import type { MetaRecord, TopNavEntry } from './types';

const external = (href: string) => /^(https?:)?\/\//.test(href);

/**
 * The header's links, from `app/_meta.tsx`, in Nextra's format: `type: 'page'` is a link (to
 * `href`, or to `/<key>`), `type: 'menu'` a dropdown of its `items`, `display: 'hidden'` nothing.
 */
export function getTopNav(meta: MetaRecord = appMeta as MetaRecord): TopNavEntry[] {
  const entries: TopNavEntry[] = [];

  for (const [key, entry] of Object.entries(meta)) {
    if (typeof entry === 'string' || entry.display === 'hidden') {
      continue;
    }
    const title = entry.title ?? key;

    if (entry.type === 'menu' && entry.items) {
      entries.push({
        key,
        title,
        items: Object.entries(entry.items).map(([itemKey, item]) => {
          const href = item.href ?? `/${itemKey}`;
          return {
            key: itemKey,
            title: item.title ?? itemKey,
            href,
            newWindow: item.newWindow ?? external(href),
          };
        }),
      });
    } else if (entry.type === 'page') {
      const href = entry.href ?? `/${key}`;
      entries.push({ key, title, href, newWindow: entry.newWindow ?? external(href) });
    }
  }

  return entries;
}
