import type { ComponentProps } from 'react';
import { ImageZoom } from 'nextra/components';

export type DocsImageProps = ComponentProps<typeof ImageZoom>;

/**
 * The docs column, measured 2026-10-11 on the Nextra 4.6.1 docs layout at 700
 * to 1920: the viewport less 32px on a phone; less 352px once the sidebar
 * shows, at 768; less 608px once the table of contents shows too, at 1280,
 * and never wider than 832px. Between 1185 and 1279 it is wider than 832 (927
 * at 1279), which a flat `832px` under-asked for, and at 768 it is 416, not
 * the 768 a `(max-width: 768px) 100vw` asked for.
 */
const PHONE_GUTTER = 32;
const SIDEBAR = 352;
const SIDEBAR_AND_TOC = 608;
const COLUMN_MAX = 832;
const SIDEBAR_FROM = 768;
const TOC_FROM = 1280;

/**
 * `sizes` for a picture drawn at the column's width, or at `drawn` when it is
 * narrower: one clause per stretch of viewport, the column's own formula
 * while the picture fills it and its fixed width once it does not.
 */
export function docsSizes(drawn = Infinity): string {
  const clauses: [string | null, string][] = [];
  const stretch = (until: number, from: number, gutter: number, top: number) => {
    // The picture fills the column until the column is wider than the picture.
    const full = drawn + gutter;
    if (drawn <= from - gutter) {
      clauses.push([`(max-width: ${until - 1}px)`, `${Math.min(drawn, top)}px`]);
    } else if (full < until && drawn < top) {
      clauses.push([`(max-width: ${full}px)`, `calc(100vw - ${gutter}px)`]);
      clauses.push([`(max-width: ${until - 1}px)`, `${drawn}px`]);
    } else {
      clauses.push([`(max-width: ${until - 1}px)`, `calc(100vw - ${gutter}px)`]);
    }
  };
  stretch(SIDEBAR_FROM, 0, PHONE_GUTTER, Infinity);
  stretch(TOC_FROM, SIDEBAR_FROM, SIDEBAR, Infinity);
  stretch(COLUMN_MAX + SIDEBAR_AND_TOC, TOC_FROM, SIDEBAR_AND_TOC, COLUMN_MAX);
  clauses.push([null, `${Math.min(drawn, COLUMN_MAX)}px`]);

  // A clause that says what the next one says is only a longer way to say it.
  const kept = clauses.filter(
    ([, size], i) => i === clauses.length - 1 || clauses[i + 1][1] !== size
  );
  return kept.map(([media, size]) => (media ? `${media} ${size}` : size)).join(', ');
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
