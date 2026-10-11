import NextImage from 'next/image';
import { Image } from '@mantine/core';

/**
 * Decorative, so `alt=""`. In the bar it sits in Nextra's logo link, which
 * `aria-label="Home page"` names whatever is inside it, beside the written
 * name from lg up; in the footer the paragraph under it opens with the name.
 * An alt that repeats the text beside it is what Lighthouse's
 * image-redundant-alt flags, as it did on lancetta.app (2026-10-11).
 *
 * Through next/image, at the size it is drawn: as a plain <img> every page
 * fetched the whole 128px PNG, 26 KB, for a 36px mark (2026-10-11).
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      component={NextImage}
      src="/icon-128x128.png"
      alt=""
      width={size}
      height={size}
      w={size}
      h={size}
      style={{ borderRadius: size > 48 ? 12 : 8 }}
    />
  );
}
