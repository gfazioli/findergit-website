import { Kbd } from '@mantine/core';
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs';
import { ShortcutsTable } from '@/components/ShortcutsTable/ShortcutsTable';

const docsComponents = getDocsMDXComponents();

export const useMDXComponents = (components?: any): any => ({
  ...docsComponents,
  Kbd,
  ShortcutsTable,
  ...components,
});
