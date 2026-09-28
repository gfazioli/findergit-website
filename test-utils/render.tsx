import { render as testingLibraryRender } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';

/**
 * `ui` goes in as given. It used to be wrapped in a fragment, which RTL's
 * `rerender` does not repeat, so the first rerender changed the tree's shape
 * and REMOUNTED the component: every ref and every piece of state reset in a
 * test that meant to update props (`render.test.tsx`, 2026-09-24).
 */
export function render(ui: React.ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    ),
  });
}
