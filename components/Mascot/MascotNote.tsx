import type { ReactNode } from 'react';
import { Mascot } from './Mascot';
import classes from './MascotNote.module.css';

interface MascotNoteProps {
  children: ReactNode;
  /** Arm up: a wave on the left of the bubble, a point at it on the right. */
  pointing?: boolean;
  /** Which side of the bubble it stands on. */
  side?: 'left' | 'right';
  /** What the note is, for assistive technology: it is an aside, not the page's text. */
  label?: string;
}

/**
 * The mascot in the docs, beside a speech bubble: to welcome a reader, or to
 * point at the thing worth knowing on a page. Used here and there, never on
 * every page, or it stops being a moment.
 *
 * No JavaScript: a server component around the same sprite the home page
 * walks (`Mascot`). The bubble's words are the page's own text, so a crawler
 * and a screen reader get them like any paragraph; the drawing is decoration
 * and says nothing (`aria-hidden` on the svg). Its one motion is CSS: a hop as
 * the page lands and on hover, and none under Reduce Motion.
 *
 * On the right, pointing, the raised arm reaches up and left toward the
 * bubble; on the left, pointing reads as a wave. Never mirrored to make it
 * point the other way: the face is the app icon's, blue half left, and a
 * mirrored icon is a different icon.
 */
export function MascotNote({
  children,
  pointing = false,
  side = 'left',
  label = 'Note',
}: MascotNoteProps) {
  return (
    <aside className={classes.note} data-side={side} aria-label={label}>
      <span className={classes.sprite}>
        <Mascot pointing={pointing} />
      </span>
      <div className={classes.bubble}>{children}</div>
    </aside>
  );
}
