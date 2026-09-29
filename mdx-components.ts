import { Kbd } from '@mantine/core';
import { Callout } from 'nextra/components';
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs';
import { DocsImage } from '@/components/DocsImage/DocsImage';
import { MascotNote } from '@/components/Mascot/MascotNote';
import { ShortcutsTable } from '@/components/ShortcutsTable/ShortcutsTable';

const docsComponents = getDocsMDXComponents();

export const useMDXComponents = (components?: any): any => ({
  ...docsComponents,
  Kbd,
  Callout,
  ShortcutsTable,
  MascotNote,
  img: DocsImage,
  ...components,
});
