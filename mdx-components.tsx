import type { MDXComponents } from 'mdx/types';
import { Kbd } from '@mantine/core';
import { DocsImage } from '@/components/DocsImage/DocsImage';
import { Callout } from '@/components/docs';
import { mdxElements } from '@/components/docs/MdxElements/MdxElements';
import { MascotNote } from '@/components/Mascot/MascotNote';
import { ShortcutsTable } from '@/components/ShortcutsTable/ShortcutsTable';
import { Tutorial } from '@/components/Tutorial/Tutorial';

/**
 * Required by `@next/mdx` in the App Router: the components every MDX page renders its HTML
 * with. The docs engine's own (`components/docs/MdxElements`, the template's file), and on top
 * the site's: the components the pages use without importing them, as they did on Nextra, and
 * `img`, every Markdown picture, drawn by `DocsImage` (zoomable, with the column's `sizes`).
 *
 * The site's own file, not the template's: the engine's knows no site component.
 */
export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...mdxElements,
    Kbd,
    Callout,
    ShortcutsTable,
    MascotNote,
    Tutorial,
    img: DocsImage as MDXComponents['img'],
    ...components,
  };
}
