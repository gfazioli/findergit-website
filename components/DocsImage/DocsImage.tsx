import type { ComponentProps } from 'react';
import { ImageZoom } from 'nextra/components';

/**
 * A docs image: Nextra's own zoomable image, told how wide it is drawn.
 *
 * Without `sizes`, next/image offers the srcset as 1x and 2x of the file's own
 * width, and the browser cannot know the column is narrower: the docs' 832px
 * column fetched the 2048px rendering on a laptop, and a phone fetched the
 * 3840px one for a picture drawn 358px wide (measured 2026-09-29, /docs/overview).
 * The column is the viewport on a phone and 832px at most elsewhere.
 */
export function DocsImage(props: ComponentProps<typeof ImageZoom>) {
  return <ImageZoom sizes="(max-width: 768px) 100vw, 832px" {...props} />;
}
