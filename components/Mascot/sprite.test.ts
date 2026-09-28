import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARMS, FACE, HEIGHT, LEGS, LEGS_TOP, PALETTE, runs, WIDTH } from './sprite';

const every = [...FACE, ...ARMS.stand, ...ARMS.point, ...LEGS.stand, ...LEGS.stepA, ...LEGS.stepB];

/** The cells of `rows` holding one of `letters`, as "x,y". */
function cellsOf(rows: readonly string[], letters: string) {
  const found = new Set<string>();
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (letters.includes(c)) {
        found.add(`${x},${y}`);
      }
    })
  );
  return found;
}

describe('the mascot sprite', () => {
  it('is drawn on one grid, 18 by 12, face then legs', () => {
    expect(every.every((row) => row.length === WIDTH)).toBe(true);
    expect(FACE.length + LEGS.stand.length).toBe(HEIGHT);
    expect(LEGS_TOP).toBe(FACE.length);
    expect(ARMS.stand.length).toBeLessThanOrEqual(FACE.length);
    expect(ARMS.point.length).toBeLessThanOrEqual(FACE.length);
  });

  it('uses no colour the palette does not name', () => {
    const used = new Set(every.join('').replace(/\./g, ''));
    expect([...used].filter((c) => !(c in PALETTE))).toEqual([]);
  });

  it('is painted in the icon’s own colours, the site’s tokens', () => {
    // Hex in the sprite, since an SVG attribute cannot take var(); this is
    // what keeps the two from drifting apart.
    const css = readFileSync(join(__dirname, '../../theme/global.css'), 'utf8');
    const token = (name: string) =>
      css.match(new RegExp(`--fg-${name}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1]?.toLowerCase();
    expect(PALETTE).toEqual({
      N: token('navy'),
      K: token('sky'),
      B: token('blue'),
      P: token('mist'),
      G: token('green'),
      O: token('orange'),
    });
  });

  it('points with an arm whose every step shares an edge with the last', () => {
    // A diagonal of single cells touches only at corners and reads as dots.
    // Walk the left arm from the hand along shared edges: it has to reach the
    // cell beside the face's outline, and take every cell of the arm with it.
    const arm = cellsOf(
      ARMS.point.map((row) => row.slice(0, 3)),
      'PG'
    );
    const [hand] = cellsOf(ARMS.point, 'G');
    const seen = new Set([hand]);
    const queue = [hand];
    while (queue.length) {
      const [x, y] = queue.shift()!.split(',').map(Number);
      for (const next of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) {
        if (arm.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen).toEqual(arm);
    // The shoulder: right beside the outline (column 3) on the arm's row.
    expect(FACE[5][3]).toBe('N');
    expect(seen.has('2,5')).toBe(true);
    // And the hand is up, above the shoulder, where it points.
    expect(Number(hand.split(',')[1])).toBeLessThan(5);
  });

  it('walks by lifting one leg, then the other', () => {
    const grounded = (legs: readonly string[]) => cellsOf([legs[1]], 'K');
    expect(grounded(LEGS.stand).size).toBe(4);
    expect(grounded(LEGS.stepA).size).toBe(2);
    expect(grounded(LEGS.stepB).size).toBe(2);
    expect([...grounded(LEGS.stepA)].some((c) => grounded(LEGS.stepB).has(c))).toBe(false);
  });
});

describe('runs', () => {
  it('turns each run of one colour into one rectangle, rows down from `top`', () => {
    expect(runs(['.NNB', 'KK..'], 10)).toEqual([
      { x: 1, y: 10, width: 2, colour: 'N' },
      { x: 3, y: 10, width: 1, colour: 'B' },
      { x: 0, y: 11, width: 2, colour: 'K' },
    ]);
  });
});
