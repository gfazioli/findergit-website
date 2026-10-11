/**
 * @jest-environment node
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// theme/mantine.css lists the Mantine stylesheets the site renders. A component
// used in the code but missing from it renders unstyled, and nothing else fails.
it('theme/mantine.css covers every Mantine component the code uses', () => {
  const root = path.join(__dirname, '..');
  expect(() =>
    execFileSync('node', ['scripts/mantine-css.mjs', '--check'], { cwd: root, stdio: 'pipe' })
  ).not.toThrow();
});
