'use client';

import NextImage, { type ImageProps } from 'next/image';
import { Modal, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { blurPlaceholder } from './blur-placeholder';
import classes from './ImageZoom.module.css';

/** The picture's size in pixels: from the import, or from `width` and `height`. */
function sizeOf({ src, width, height }: ImageProps) {
  const image = typeof src === 'object' ? ('default' in src ? src.default : src) : undefined;
  const w = Number(image?.width ?? width);
  const h = Number(image?.height ?? height);
  return w > 0 && h > 0 ? { w, h } : undefined;
}

/**
 * The zoomed copy's width: the file's own, at most the viewport's 90% either way. Left to
 * `width: auto`, a Retina screen drew it at its density-corrected width, which next/image's
 * largest candidate (3840w, never upscaled) made smaller than the picture it enlarges: a 2000px
 * screenshot shown at 812 in the page opened at 744, a 278px crop at 103. Undefined for a
 * picture of unknown size (`fill`, which takes no width of its own): it keeps the viewport.
 */
function zoomWidth(props: ImageProps) {
  const size = sizeOf(props);
  return size ? `min(90vw, ${size.w}px, calc(90vh * ${size.w / size.h}))` : undefined;
}

/**
 * An image that opens full size in a Mantine `Modal` when clicked. Takes `next/image`'s props,
 * as Nextra's `<ImageZoom>` does, and paints an import's blurred preview first.
 */
export function ImageZoom(props: ImageProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const placeholder = props.placeholder ?? blurPlaceholder(props.src);
  const zoomed = zoomWidth(props);

  return (
    <>
      <UnstyledButton
        onClick={open}
        className={classes.trigger}
        aria-label={`Enlarge: ${props.alt}`}
      >
        {/* Its alt text is searchable, as on Nextra (`pagefind.ts`'s index reads the attribute). */}
        <NextImage {...props} placeholder={placeholder} data-pagefind-index-attrs="title,alt" />
      </UnstyledButton>
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        centered
        padding={0}
        radius="md"
        withCloseButton={false}
        classNames={{ body: classes.body }}
      >
        {/* The page's own size (`style`, `className`) is for the thumbnail: the zoomed copy
            drops it, is drawn at `zoomed` and asks for that much. */}
        <NextImage
          {...props}
          style={zoomed ? { width: zoomed } : undefined}
          sizes={zoomed ?? '100vw'}
          className={classes.full}
          onClick={close}
          alt={props.alt}
        />
      </Modal>
    </>
  );
}
