import type { ComponentProps } from 'react';
import { ImageZoom } from 'nextra/components';

export type DocsImageProps = ComponentProps<typeof ImageZoom>;

/**
 * The docs column of the Nextra 4.6.1 layout, measured from 700 to 2000 px
 * wide on the four app sites, with the browser's default font at 16 and at
 * 20px (2026-10-11). Nextra lays it out in rem, so it moves with the visitor's
 * font: the viewport less 2rem on a phone; less 22rem once the sidebar shows,
 * at 48em; less 38rem once the table of contents shows too, at 80em; and never
 * wider than 52rem. At 16px that is 32, 352 and 608 px, and 832 at most; at
 * 20px, 40, 440, 760 and 1040.
 *
 * In px, the first version under-asked for a visitor with a larger font: at
 * 20px and 900 px wide the column is 860, still the phone's, and a px `sizes`
 * said 548 (found in review). Each stretch ends where the layout switches,
 * with range syntax (`width < 48em`), which excludes the breakpoint itself, so
 * no viewport, however fractional, falls between two. Chrome and Safari read
 * it in `sizes` (measured); a browser that does not skips those clauses and
 * takes `52rem`: more bytes, never a rendering too small.
 */
const STRETCHES: { below?: string; column: string }[] = [
  { below: '48em', column: 'calc(100vw - 2rem)' },
  { below: '80em', column: 'calc(100vw - 22rem)' },
  { below: '90em', column: 'calc(100vw - 38rem)' },
  { column: '52rem' },
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
 * pixels, one CSS pixel each. Nextra's stylesheet gives an image no width but
 * `max-width: 100%`, so the `width` next/image writes from the import is the
 * width it takes.
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
 * A docs image: Nextra's own zoomable image, told how wide it is drawn.
 *
 * Without `sizes`, next/image offers the srcset as 1x and 2x of the file's own
 * width, and the browser cannot know the column is narrower: the docs' 832px
 * column fetched the 2048px rendering on a laptop, and a phone fetched the
 * 3840px one for a picture drawn 358px wide (measured 2026-09-29, /docs/overview).
 * `docsSizes` follows the column as it was measured, and a picture narrower
 * than the column says its own width.
 */
export function DocsImage(props: DocsImageProps) {
  return <ImageZoom sizes={docsSizes(drawnWidth(props.src))} {...props} />;
}
