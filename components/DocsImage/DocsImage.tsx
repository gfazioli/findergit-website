import type { ComponentProps } from 'react';
import { ImageZoom } from '@/components/docs';

export type DocsImageProps = ComponentProps<typeof ImageZoom>;

/**
 * The docs column of the docs engine (`components/shell`: `SiteShell`'s
 * 280px sidebar from Mantine's md, 62em; `DocsPage`'s padding, 1rem on a
 * phone and 2rem from md, its 15rem table of contents and 2rem gap from lg,
 * 75em, the column at most 53.75rem in a 73.75rem page). All of it is rem and
 * em, so it moves with the visitor's default font:
 *
 * - the viewport less 2rem, until that reaches the column's 53.75rem;
 * - 53.75rem, until the sidebar shows at 62em;
 * - the viewport less 21.5rem (the sidebar and the padding), until the table
 *   of contents shows at 75em;
 * - the viewport less 38.5rem (both, the gap and the padding), until the page
 *   reaches its 73.75rem, at 91.25em;
 * - 52.75rem from there.
 *
 * Each stretch ends where the layout switches, with range syntax
 * (`width < 48em`), which excludes the breakpoint itself, so no viewport,
 * however fractional, falls between two. Chrome and Safari read it in `sizes`
 * (measured); a browser that does not skips those clauses and takes the last:
 * more bytes, never a rendering too small. A page with no table of contents,
 * or a collapsed sidebar, draws the column wider than this from 75em: such a
 * picture is fetched a step smaller than its drawn width, never at the
 * wrong ratio.
 */
const STRETCHES: { below?: string; column: string }[] = [
  { below: '55.75em', column: 'calc(100vw - 2rem)' },
  { below: '62em', column: '53.75rem' },
  { below: '75em', column: 'calc(100vw - 21.5rem)' },
  { below: '91.25em', column: 'calc(100vw - 38.5rem)' },
  { column: '52.75rem' },
];

/**
 * `sizes` for a picture drawn at the column's width, or at `width` CSS px when
 * the column is wider: `min()` of the two in each stretch. Chrome and Safari
 * take `min()` in `sizes` (measured); a browser that does not falls back to
 * `100vw`, which fetches more, never a rendering too small.
 */
export function docsSizes(width?: number): string {
  return STRETCHES.map(({ below, column }) => {
    const size = width === undefined ? column : `min(${column}, ${width}px)`;
    return below ? `(width < ${below}) ${size}` : size;
  }).join(', ');
}

/**
 * How wide a picture is drawn when the column is wider: its width in file
 * pixels, one CSS pixel each. The engine's zoomable image gives it no width
 * but `max-width: 100%` (`components/docs/ImageZoom`), so the `width`
 * next/image writes from the import is the width it takes.
 *
 * Not half of it, as on a site whose captures are Retina's two pixels per
 * point. These are not: `FinderGit/scripts/screenshots/shoot.sh` runs the
 * window at 1700x1050 points and resamples every capture to 2000px wide, and
 * every crop by about the same factor: 1700 points of window in 2000 pixels,
 * not 3400. Halved, the sidebar crop (278px) would be drawn at 139, smaller
 * than on the Mac, and the window shots are wider than the column either way.
 * The one docs picture that is 2x, the Recent stars popover (1040x696, drawn
 * at 520x348 points by `FinderGit/scripts/uiprobe/stars.swift`), carries
 * nothing in its name or file that says so, and is drawn as it always was.
 *
 * Only a static import knows its size; anything else is asked for at the
 * column's width.
 */
function drawnWidth(src: DocsImageProps['src']): number | undefined {
  if (typeof src !== 'object') {
    return undefined;
  }
  return 'default' in src ? src.default.width : src.width;
}

/**
 * `blur` when the import carries a blurred preview (a PNG or a JPEG; next/image
 * makes none for an SVG or a GIF, and `blur` without one is an error).
 *
 * As on Nextra, which set it on every static image: the preview, inlined in the
 * HTML, is painted with the page, and the picture replaces it when it arrives.
 * Without it a docs page showed an empty box where its first screenshot goes
 * until the file came in, and its LCP moved from the preview's paint to the
 * picture's: 1.6 s to 3.3 s on /docs, Lighthouse mobile (2026-11-28).
 */
function placeholderOf(src: DocsImageProps['src']): 'blur' | undefined {
  if (typeof src !== 'object') {
    return undefined;
  }
  const image = 'default' in src ? src.default : src;
  return image.blurDataURL ? 'blur' : undefined;
}

/**
 * A docs image: the engine's zoomable image, told how wide it is drawn. Every
 * Markdown image in `content/` comes here (`mdx-components.tsx`), imported by
 * the engine's `remark-static-images` from `public/`.
 *
 * Without `sizes`, next/image offers the srcset as 1x and 2x of the file's own
 * width, and the browser cannot know the column is narrower: the docs' 832px
 * column fetched the 2048px rendering on a laptop, and a phone fetched the
 * 3840px one for a picture drawn 358px wide (measured 2026-09-29, /docs/overview).
 * `docsSizes` follows the column as it was measured, and a picture narrower
 * than the column says its own width.
 */
export function DocsImage(props: DocsImageProps) {
  return (
    <ImageZoom
      sizes={docsSizes(drawnWidth(props.src))}
      placeholder={placeholderOf(props.src)}
      {...props}
    />
  );
}
