import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEIGHT } from './sprite';

/*
 * On a phone the Support card's bubble hangs from its bottom, so a line that
 * wraps to more rows grows up into the room above the card instead of down
 * over the card's title (it covered it at 320-430px). Layout is not something
 * jsdom draws, so this reads the stylesheet's shape; the geometry was measured
 * in a browser at seven widths.
 */
const css = readFileSync(join(__dirname, 'Mascot.module.css'), 'utf8');

/** The text between the braces that open at `at`. */
function block(at: number) {
  const open = css.indexOf('{', at);
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
  throw new Error('unclosed block');
}

/** The one phone media block that restyles the card's bubble. */
function phoneBubbleRules() {
  const header = '@media (max-width: $mantine-breakpoint-sm) {\n  .cardBubble {';
  const at = css.indexOf(header);
  expect(at).toBeGreaterThanOrEqual(0);
  expect(css.indexOf(header, at + 1)).toBe(-1);
  return block(at);
}

function rule(media: string, selector: string) {
  const at = media.indexOf(`${selector} {`);
  expect(at).toBeGreaterThanOrEqual(0);
  const open = media.indexOf('{', at);
  return media.slice(open + 1, media.indexOf('}', open));
}

describe('the Support card bubble on a phone', () => {
  it('hangs from its bottom, above the card, not from the top of the mascot', () => {
    const bubble = rule(phoneBubbleRules(), '.cardBubble');
    expect(bubble).toMatch(/(^|\s)top: auto;/);
    expect(bubble).toMatch(/(^|\s)bottom: rem\(4px\);/);
    expect(bubble).toMatch(/transform-origin: bottom right;/);
  });

  it('keeps the tail at the face, measured up from the feet of a sprite this tall', () => {
    // The tail sat 14px down a bubble 4px above the head: 20px from the top
    // of the sprite to its lower corner. From the feet that is the sprite's
    // height less 20px, less the 4px the bubble now stands above the card.
    const tail = rule(phoneBubbleRules(), '.cardBubble::before');
    expect(tail).toMatch(/(^|\s)top: auto;/);
    expect(tail).toContain(`bottom: calc(var(--cell) * ${HEIGHT} - rem(24px));`);
  });
});
