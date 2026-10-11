import { Image } from '@mantine/core';

/**
 * Decorative, so `alt=""`. In the bar it sits in Nextra's logo link, which
 * `aria-label="Home page"` names whatever is inside it, beside the written
 * name from lg up; in the footer the paragraph under it opens with the name.
 * An alt that repeats the text beside it is what Lighthouse's
 * image-redundant-alt flags, as it did on lancetta.app (2026-10-11).
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/icon-128x128.png"
      alt=""
      w={size}
      h={size}
      style={{ borderRadius: size > 48 ? 12 : 8 }}
    />
  );
}
