export interface PageSource {
  title?: string;
  sidebarTitle?: string;
  heading?: string;
}

/**
 * The titles a page declares in its source: front matter `title` and `sidebarTitle`, and its
 * first `#` heading outside code fences (inline Markdown marks stripped).
 */
export function parsePageSource(source: string): PageSource {
  const result: PageSource = {};

  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontMatter) {
    for (const line of frontMatter[1].split(/\r?\n/)) {
      const field = line.match(/^(title|sidebarTitle):\s*(.+?)\s*$/);
      if (field) {
        result[field[1] as 'title' | 'sidebarTitle'] = field[2].replace(/^(['"])(.*)\1$/, '$2');
      }
    }
  }

  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    const heading = !inFence && line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (heading) {
      result.heading = heading[1].replace(/[`*_]/g, '');
      break;
    }
  }

  return result;
}

/** `inline-svg` → `Inline Svg`: the last resort for a page with no title anywhere. */
export function titleFromName(name: string): string {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
