import { Image } from '@mantine/core';

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/icon-128x128.png"
      alt="FinderGit"
      w={size}
      h={size}
      style={{ borderRadius: size > 48 ? 12 : 8 }}
    />
  );
}
