import type { ImageProps } from 'next/image';

/**
 * `blur` when `src` is an import that carries a blurred preview (a PNG or a JPEG; `next/image`
 * makes none for an SVG or a GIF, and `blur` without one is an error). Nextra set it on every
 * static image: the preview, inlined in the HTML, is painted with the page and the picture
 * replaces it when it arrives, where a page would otherwise show an empty box.
 */
export function blurPlaceholder(src: ImageProps['src']): 'blur' | undefined {
  if (typeof src !== 'object') {
    return undefined;
  }
  const image = 'default' in src ? src.default : src;
  return image.blurDataURL ? 'blur' : undefined;
}
