'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useReveal } from './useReveal';
import classes from './Motion.module.css';

/**
 * How an item arrives. See Motion.module.css for each starting pose. `left`
 * and `right` are for a screenshot, in from the side of the row it sits on.
 */
export type RevealVariant = 'morph' | 'rise' | 'pop' | 'left' | 'right';

/**
 * Props that make an element a scope: the thing the observer watches. Pass it
 * what `useReveal` returned; see there for what armed and revealed mean.
 */
export function revealScope({ armed, revealed }: { armed: boolean; revealed: boolean }) {
  return {
    className: classes.scope,
    'data-armed': armed ? '' : undefined,
    'data-revealed': revealed ? '' : undefined,
  };
}

/** Props that make an element an item: the thing that moves, `delay` ms after its scope. */
export function revealItem(variant: RevealVariant, delay = 0) {
  return {
    className: classes.item,
    'data-reveal': variant,
    style: { '--reveal-delay': `${delay}ms` } as CSSProperties,
  };
}

type RevealProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  variant?: RevealVariant;
  delay?: number;
  /**
   * The corner of the card inside, for a `morph` wrapper: the light runs round
   * the wrapper's rim, and a wrapper has no radius of its own.
   */
  radius?: number | string;
  children: ReactNode;
};

/**
 * A wrapper that is its own scope and item: it watches itself and moves
 * itself. A wrapper rather than props on the child, so it never fights a
 * transform the child already uses for hover.
 */
export function Reveal({
  variant = 'morph',
  delay = 0,
  radius,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const reveal = useReveal<HTMLDivElement>();
  const scope = revealScope(reveal);
  const item = revealItem(variant, delay);
  const corner =
    radius === undefined
      ? undefined
      : ({
          '--reveal-radius': typeof radius === 'number' ? `${radius}px` : radius,
        } as CSSProperties);
  return (
    <div
      ref={reveal.ref}
      {...rest}
      data-reveal={item['data-reveal']}
      data-armed={scope['data-armed']}
      data-revealed={scope['data-revealed']}
      className={[scope.className, item.className, className].filter(Boolean).join(' ')}
      style={{ ...item.style, ...corner, ...style }}
    >
      {children}
    </div>
  );
}
