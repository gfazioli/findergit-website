/**
 * FinderGit's mascot: the app icon's face come alive. The face is the icon's
 * two halves -- the Finder's blue on the left, sky across its top rows, the
 * plate's mist on the right, the blue pushing into the mist where the nose is
 * -- with the icon's navy outline, eyes and smile. Its arms are the git graph
 * that runs round the face in the icon, each one ending in a commit node for a
 * hand, green and orange like the icon's nodes; its legs are the sky. Drawn for
 * this site from our own icon, as lancetta.app's is from Lancetta's: a
 * vendor's character inviting clicks on this app would read as an endorsement
 * it never gave (user, 2026-09-23, on Lancetta).
 *
 * The grids ARE the drawing: `Mascot.tsx` turns each run of one letter into a
 * rectangle, so what is below is what the page draws, cell for cell. 18 cells
 * wide, 12 tall, at 4 px a cell. One letter per colour (`PALETTE`), `.` empty.
 *
 * Walking, the legs alternate (`LEGS.stepA`, `LEGS.stepB`); pointing, the left
 * arm climbs up and out from the shoulder, a staircase whose every step shares
 * an EDGE with the last -- a diagonal of single cells touches only at corners,
 * and at this size reads as a row of dots, not as an arm (measured on
 * lancetta.app's).
 */

/**
 * The icon's colours, the same values as the `--fg-*` tokens in
 * theme/global.css (`sprite.test.ts` holds them to it). Hex rather than
 * `var()`: an SVG presentation attribute is not a CSS declaration.
 */
export const PALETTE = {
  /** --fg-navy: the outline, the eyes, the smile. */
  N: '#163d7a',
  /** --fg-sky: the top of the blue half, and the legs. */
  K: '#7dc3eb',
  /** --fg-blue: the blue half. */
  B: '#609be3',
  /** --fg-mist: the pale half, and the arms (the git lines). */
  P: '#c1cbe7',
  /** --fg-green: the pointing hand, a commit node. */
  G: '#9ccb7e',
  /** --fg-orange: the other hand. */
  O: '#f0a258',
} as const;

export type Colour = keyof typeof PALETTE;

export const WIDTH = 18;
export const HEIGHT = 12;

/** The face, rows 0-9: outline, the two halves, the nose, eyes and smile. */
export const FACE = [
  '....NNNNNNNNNN....',
  '...NKKKKKPPPPPN...',
  '...NKKNKKPPNPPN...',
  '...NBBNBBPPNPPN...',
  '...NBBBBBBPPPPN...',
  '...NBBBBBBPPPPN...',
  '...NBNBBBPPPNPN...',
  '...NBBNNNNNNPPN...',
  '...NBBBBBPPPPPN...',
  '....NNNNNNNNNN....',
];

/** The arms, over the face's rows. Standing, both hang; pointing, the left one is up. */
export const ARMS = {
  stand: [
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..P............P..',
    '..P............P..',
    '..G............O..',
  ],
  point: [
    '..................',
    '..................',
    'G.................',
    'PP................',
    '.P................',
    '.PP............P..',
    '...............P..',
    '...............O..',
  ],
} as const;

/**
 * The legs, rows 10-11: a leg on the ground is two cells tall, a lifted one is
 * one, off the ground.
 */
export const LEGS = {
  stand: ['.....KK....KK.....', '.....KK....KK.....'],
  stepA: ['.....KK....KK.....', '.....KK...........'],
  stepB: ['.....KK....KK.....', '...........KK.....'],
} as const;

export const LEGS_TOP = FACE.length;

export interface Cell {
  x: number;
  y: number;
  width: number;
  colour: Colour;
}

/** Each horizontal run of one colour in `rows`, as one rectangle, `top` rows down. */
export function runs(rows: readonly string[], top = 0): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const colour = row[x];
      if (colour === '.') {
        x += 1;
        continue;
      }
      let width = 1;
      while (row[x + width] === colour) {
        width += 1;
      }
      cells.push({ x, y: y + top, width, colour: colour as Colour });
      x += width;
    }
  });
  return cells;
}
