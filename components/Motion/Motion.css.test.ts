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

  it('fades every item in from where the armed rule has it', () => {
    const armed = body('.scope[data-armed]:not([data-revealed]) .item,');
    expect(value(armed, 'opacity')).toBe('0');
    expect(value(body('@keyframes reveal-fade {'), 'opacity')).toBe('0');
  });
});

/*
 * Everything here moves on the compositor, or the page's scroll pays for it.
 * Chrome runs only opacity and transform there: a `filter: blur()` that moves
 * pixels, a custom property, or a box-shadow all run on the main thread, once
 * a frame for each item that moves -- and the home page moves 93 of them.
 * Taking the blur and the rim's `--glint` out cut half of the GPU time of a
 * scroll down the page (measured on production, 2026-10-13).
 */
describe('Motion.module.css, on the compositor', () => {
  const keyframes = [...css.matchAll(/@keyframes ([\w-]+) \{/g)].map((match) => match[1]);

  it.each(keyframes)('@keyframes %s moves only opacity and transform', (name) => {
    const properties = [...body(`@keyframes ${name} {`).matchAll(/([\w-]+):/g)].map(
      (match) => match[1]
    );
    expect(properties.length).toBeGreaterThan(0);
    expect(properties.filter((p) => p !== 'opacity' && p !== 'transform')).toEqual([]);
  });

  it('transitions only opacity and transform', () => {
    const transitions = [...css.matchAll(/transition:([^;]+);/g)].map((match) => match[1]);
    expect(transitions.length).toBeGreaterThan(0);
    for (const list of transitions) {
      // The commas inside cubic-bezier() and calc() are not between transitions.
      let flat = list;
      while (/\([^()]*\)/.test(flat)) {
        flat = flat.replace(/\([^()]*\)/g, '');
      }
      const properties = flat.split(',').map((one) => one.trim().split(/\s+/)[0]);
      expect(properties.filter((p) => p !== 'opacity' && p !== 'transform')).toEqual([]);
    }
  });

  it('keeps the rim off at rest, and its keyframes start and end dark', () => {
    const opacities = [...body('@keyframes glint {').matchAll(/opacity: ([\d.]+);/g)].map((match) =>
      Number(match[1])
    );
    expect(opacities).toHaveLength(11);
    expect(opacities[0]).toBe(0);
    expect(opacities.at(-1)).toBe(0);
    expect(Math.max(...opacities)).toBeLessThanOrEqual(0.9);
    expect(value(body(".item[data-reveal='morph']::after {"), 'opacity')).toBe('0');
  });
});
