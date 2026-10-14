import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/*
 * Every animation the site's own stylesheets declare moves only what Chrome
 * runs on the compositor. Anything else -- a box-shadow, a filter that moves
 * pixels, a custom property, a width -- ticks on the main thread once a frame,
 * and an infinite one does it for as long as the page is open: three
 * box-shadow pulses cost 1.03 s of main thread per 10 s at rest (2026-09-29),
 * and the footer's NEW badge alone 0.6-0.8 s (2026-10-14, CPU 4x). Mantine's
 * generated `theme/mantine.css` is not ours and is left out.
 */
const ROOT = join(__dirname, '..');
const COMPOSITED = ['opacity', 'transform', 'translate', 'scale', 'rotate'];

function stylesheets(): string[] {
  return ['app', 'components', 'theme']
    .flatMap((dir) =>
      readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' }).map((file) =>
        join(ROOT, dir, file)
      )
    )
    .filter((file) => file.endsWith('.css') && !file.endsWith(join('theme', 'mantine.css')));
}

/** Each `@keyframes` block in a stylesheet: its name and the text between its braces. */
function keyframes(css: string) {
  return [...css.matchAll(/@keyframes ([\w-]+)\s*\{/g)].map((match) => {
    const open = match.index + match[0].length - 1;
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') {
        depth += 1;
      } else if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          return { name: match[1], body: css.slice(open + 1, i) };
        }
      }
    }
    throw new Error(`unclosed @keyframes ${match[1]}`);
  });
}

const blocks = stylesheets().flatMap((file) =>
  keyframes(readFileSync(file, 'utf8')).map((block) => ({
    ...block,
    where: `${relative(ROOT, file)} @keyframes ${block.name}`,
  }))
);

describe('the site’s own animations', () => {
  it('finds the stylesheets it guards', () => {
    expect(blocks.length).toBeGreaterThan(20);
  });

  it.each(blocks.map((block) => [block.where, block.body]))(
    '%s moves only what the compositor runs',
    (_where, body) => {
      // A keyframe's own timing function is a descriptor, not a property it moves.
      const properties = [...body.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([\w-]+)\s*:/g)]
        .map((match) => match[1])
        .filter((p) => p !== 'animation-timing-function');
      expect(properties.length).toBeGreaterThan(0);
      expect(properties.filter((p) => !COMPOSITED.includes(p))).toEqual([]);
    }
  );
});
