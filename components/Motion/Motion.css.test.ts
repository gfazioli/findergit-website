import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The entrance at rest (Motion.module.css, top) plays with or without the
 * scripts, so what keeps the content safe is the stylesheet's own shape, and
 * that is what these read: keyframes that name only where they start, so they
 * end on the layout's values; a fill that is only backwards; and the starting
 * pose written the same in the keyframes as in the armed rules, which say it
 * a second time.
 */
const css = readFileSync(join(__dirname, 'Motion.module.css'), 'utf8');

/** The text between the braces that follow `header`, which must occur once. */
function body(header: string) {
  const at = css.indexOf(header);
  if (at < 0 || css.indexOf(header, at + 1) >= 0) {
    throw new Error(`expected exactly one ${JSON.stringify(header)}`);
  }
  const open = css.indexOf('{', at + header.length - 1);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') {
      depth += 1;
    } else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  throw new Error(`unclosed ${header}`);
}

/** One declaration's value in a block, e.g. `transform`. */
function value(block: string, property: string) {
  const match = block.match(new RegExp(`(?:^|[\\s;{])${property}:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`no ${property} in ${block}`);
  }
  return match[1].trim();
}

const ENTRANCES = [
  'reveal-fade',
  'reveal-blur',
  'reveal-blur-text',
  'reveal-blur-chip',
  'reveal-morph',
  'reveal-rise',
  'reveal-pop',
  'reveal-left',
  'reveal-right',
  'roll-in',
];

describe('Motion.module.css, the entrance at rest', () => {
  it.each(ENTRANCES)('%s names only where it starts', (name) => {
    const frames = body(`@keyframes ${name} {`).trim();
    expect(frames.startsWith('from {')).toBe(true);
    expect(frames).not.toMatch(/\bto\s*\{|%\s*\{/);
  });

  it('fills only backwards, so nothing of it outlives its curve', () => {
    expect(css).not.toMatch(/animation-fill-mode:\s*(both|forwards)/);
    expect(css.match(/animation-fill-mode: backwards;/g)).toHaveLength(2);
  });

  it('stops once a script has armed the scope', () => {
    expect(body('.scope[data-armed] .item,\n  .scope.item[data-armed] {')).toContain(
      'animation: none;'
    );
    expect(body('.number[data-armed] .strip {')).toContain('animation: none;');
  });

  it.each([
    ['morph', 'reveal-morph'],
    ['rise', 'reveal-rise'],
    ['pop', 'reveal-pop'],
    ['left', 'reveal-left'],
    ['right', 'reveal-right'],
  ])('starts a %s from the pose its armed rule names', (variant, frames) => {
    const armed = body(`.scope[data-armed]:not([data-revealed]) .item[data-reveal='${variant}'],`);
    expect(value(body(`@keyframes ${frames} {`), 'transform')).toBe(value(armed, 'transform'));
  });

  it.each([
    ["'rise'", 'reveal-blur-text'],
    ["'pop'", 'reveal-blur-chip'],
  ])('blurs a %s item as much as its armed rule does', (variant, frames) => {
    const armed = body(`.scope[data-armed]:not([data-revealed]) .item[data-reveal=${variant}],`);
    expect(value(body(`@keyframes ${frames} {`), 'filter')).toBe(value(armed, 'filter'));
  });

  it('blurs every other item as much as the armed rule does', () => {
    const armed = body('.scope[data-armed]:not([data-revealed]) .item,');
    expect(value(body('@keyframes reveal-blur {'), 'filter')).toBe(value(armed, 'filter'));
    expect(value(armed, 'opacity')).toBe('0');
    expect(value(body('@keyframes reveal-fade {'), 'opacity')).toBe('0');
  });
});
