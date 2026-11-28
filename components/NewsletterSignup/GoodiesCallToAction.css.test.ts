import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The Goodies' fan moves once and rests (GoodiesCallToAction.module.css), and
 * not at all for a visitor who asked for less motion. That is the stylesheet's
 * own shape, which is what these read: a browser would have to be watched for
 * a minute to say the same.
 */
const css = readFileSync(join(__dirname, 'GoodiesCallToAction.module.css'), 'utf8')
  // Comments say `animation` and `transition` too.
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** Each `{ ... }` block that follows a header matching `pattern`, with its header. */
function blocks(pattern: RegExp) {
  const found: { header: string; body: string }[] = [];
  for (const match of css.matchAll(pattern)) {
    const open = css.indexOf('{', match.index);
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') {
        depth += 1;
      } else if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          found.push({ header: css.slice(match.index, open).trim(), body: css.slice(open + 1, i) });
          break;
        }
      }
    }
  }
  return found;
}

const motion = blocks(/@media \(prefers-reduced-motion: no-preference\)/g);
const keyframes = blocks(/@keyframes [\w-]+/g);

describe('GoodiesCallToAction.module.css, the motion', () => {
  it('is all in one block a visitor who asked for less motion never gets', () => {
    expect(motion).toHaveLength(1);
    const outside = css.replace(motion[0].body, '');
    // Outside it, only the keyframes are left to name a movement.
    expect(outside).not.toMatch(/\banimation(-[a-z-]+)?\s*:/);
    expect(outside).not.toMatch(/\btransition(-[a-z-]+)?\s*:/);
    expect(outside).not.toMatch(/:hover[^{]*\{[^}]*\btransform\s*:/);
    expect(css).not.toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it('plays each animation once, and rests on the rule the piece is written with', () => {
    const animations = [...motion[0].body.matchAll(/\banimation:\s*([^;]+);/g)].map((m) => m[1]);
    expect(animations.length).toBeGreaterThanOrEqual(6);
    for (const animation of animations) {
      expect(animation).toMatch(/\bbackwards$/);
      expect(animation).not.toMatch(/\b(infinite|forwards|both|alternate)\b/);
      // A name, a duration, an easing, an optional delay, the fill: no count.
      expect(animation).not.toMatch(/\s\d+(\.\d+)?\s/);
    }
    expect(css).not.toMatch(/animation-iteration-count|animation-fill-mode|animation-direction/);
  });

  it('moves only transform and opacity', () => {
    expect(keyframes.length).toBeGreaterThanOrEqual(6);
    for (const { header, body } of keyframes) {
      const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      expect(properties.length).toBeGreaterThan(0);
      expect({
        header,
        others: properties.filter((p) => p !== 'transform' && p !== 'opacity'),
      }).toEqual({ header, others: [] });
    }
    const transitions = [...motion[0].body.matchAll(/\btransition:\s*([^;]+);/g)].map((m) => m[1]);
    for (const transition of transitions) {
      expect(transition).toMatch(/^transform \d+ms/);
    }
  });

  it('plays every keyframes it declares, and declares every one it plays', () => {
    const declared = keyframes.map(({ header }) => header.replace('@keyframes ', '')).sort();
    const played = [...motion[0].body.matchAll(/\banimation:\s*([\w-]+)/g)].map((m) => m[1]).sort();
    expect(played).toEqual(declared);
  });

  it('sizes the fan before a picture loads, in rem', () => {
    const fan = blocks(/\.fan(?=\s*\{)/g)[0].body;
    expect(fan).toMatch(/height:\s*calc\([\d.]+ \* var\(--u\)\);/);
    for (const [, unit] of css.matchAll(/--u:\s*([^;]+);/g)) {
      expect(unit).toMatch(/^[\d.]+rem$/);
    }
  });
});
