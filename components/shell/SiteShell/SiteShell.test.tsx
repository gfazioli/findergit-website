import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppShell } from '@mantine/core';
import { render } from '@/test-utils';

/**
 * Before React runs, a stored "collapsed" sidebar is collapsed by a CSS rule in
 * SiteShell.module.css that copies the variables AppShell itself sets for a navbar collapsed on
 * desktop. This canary fails when a Mantine release changes them, or when the copy drifts.
 */
const COLLAPSED = {
  '--app-shell-navbar-offset': '0px',
  '--app-shell-navbar-transform': 'translateX(calc(var(--app-shell-navbar-width) * -1))',
  '--app-shell-navbar-transform-rtl': 'translateX(var(--app-shell-navbar-width))',
};

const compact = (css: string) => css.replace(/\s+/g, '');

function declarations(css: string, variable: string): string[] {
  const pattern = new RegExp(`${variable}:([^;]+?)(?:!important)?;`, 'g');
  return [...compact(css).matchAll(pattern)].map((match) => match[1]);
}

describe('the pre-paint sidebar collapse', () => {
  it('copies the variables AppShell sets for a navbar collapsed on desktop', () => {
    render(
      <AppShell navbar={{ width: 280, breakpoint: 'md', collapsed: { desktop: true } }}>
        <AppShell.Navbar>Navbar</AppShell.Navbar>
      </AppShell>
    );
    const mantineCss = [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .join('\n');
    const ourCss = readFileSync(join(__dirname, 'SiteShell.module.css'), 'utf8');

    for (const [variable, value] of Object.entries(COLLAPSED)) {
      expect(declarations(mantineCss, variable)).toContain(compact(value));
      expect(declarations(ourCss, variable)).toContain(compact(value));
    }
  });
});
