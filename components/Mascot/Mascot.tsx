import { ARMS, FACE, HEIGHT, LEGS, LEGS_TOP, PALETTE, runs, WIDTH } from './sprite';
import classes from './Mascot.module.css';

/** Pixels per cell. Whole pixels, so `crispEdges` lands every edge on the grid. */
const SCALE = 4;

// The drawing never changes, so it is turned into rectangles once.
const face = runs(FACE);
const arms = { stand: runs(ARMS.stand), point: runs(ARMS.point) };
const legs = {
  stand: runs(LEGS.stand, LEGS_TOP),
  stepA: runs(LEGS.stepA, LEGS_TOP),
  stepB: runs(LEGS.stepB, LEGS_TOP),
};

function Cells({ cells }: { cells: ReturnType<typeof runs> }) {
  return (
    <>
      {cells.map(({ x, y, width, colour }) => (
        <rect key={`${x},${y}`} x={x} y={y} width={width} height={1} fill={PALETTE[colour]} />
      ))}
    </>
  );
}

/**
 * The sprite (see `sprite.ts` for the drawing and why it is ours). Walking,
 * both leg frames are drawn and the stylesheet shows one at a time; pointing,
 * the left arm is up.
 */
export function Mascot({ walking = false, pointing = false }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH * SCALE}
      height={HEIGHT * SCALE}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
      className={classes.sprite}
    >
      <Cells cells={face} />
      <Cells cells={pointing ? arms.point : arms.stand} />
      {walking ? (
        <>
          <g className={classes.stepA}>
            <Cells cells={legs.stepA} />
          </g>
          <g className={classes.stepB}>
            <Cells cells={legs.stepB} />
          </g>
        </>
      ) : (
        <Cells cells={legs.stand} />
      )}
    </svg>
  );
}
