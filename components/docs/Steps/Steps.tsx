import { Box } from '@mantine/core';
import classes from './Steps.module.css';

/**
 * Numbered vertical steps. The numbering is pure CSS counters on the
 * headings nested inside, whatever their level (`h2` to `h6`, as Nextra numbers them: a page that
 * puts its sub-steps under `####` keeps them numbered).
 */
export function Steps({ children }: { children: React.ReactNode }) {
  return <Box className={classes.steps}>{children}</Box>;
}
