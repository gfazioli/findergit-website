'use client';

import NextImage, { type ImageProps } from 'next/image';
import { Modal, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './ImageZoom.module.css';

/**
 * An image that opens full size in a Mantine `Modal` when clicked. Takes `next/image`'s props,
 * as Nextra's `<ImageZoom>` does.
 */
export function ImageZoom(props: ImageProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <UnstyledButton
        onClick={open}
        className={classes.trigger}
        aria-label={`Enlarge: ${props.alt}`}
      >
        <NextImage {...props} />
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
            drops it and takes the viewport. */}
        <NextImage
          {...props}
          style={undefined}
          sizes="100vw"
          className={classes.full}
          onClick={close}
          alt={props.alt}
        />
      </Modal>
    </>
  );
}
