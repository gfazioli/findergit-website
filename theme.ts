'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'findergit',
  /*
   * Mantine's dark scheme fills with shade 8 by default, which here is the
   * icon's outline navy: every Download button came out a dull denim. Shade
   * 6 in both, the Finder's blue.
   */
  primaryShade: { light: 6, dark: 6 },
  /*
   * White on a filled button only where it measures 4.5:1 or more, dark ink
   * where it does not: the coffee button's yellow, a light-variant badge.
   */
  autoContrast: true,
  colors: {
    /*
     * The Finder face in the icon, read from its lit top (#7dc3eb, sky) to
     * its body (#609be3) and down into the outline's navy (#274e85, #163d7a).
     * Sampled from public/icon-512x512.png. Shade 6 is the one filled
     * buttons use, cut between the two so white on it measures 4.7:1.
     */
    findergit: [
      '#eaf4fd',
      '#d4e8fa',
      '#a9d2f3',
      '#7dc3eb',
      '#6eb1eb',
      '#609be3',
      '#2f73cc',
      '#2a60ad',
      '#274e85',
      '#163d7a',
    ],
    /*
     * Mantine's dark scheme is built on this scale (text dark-0, dimmed
     * dark-2, borders dark-4, surfaces dark-6 to dark-9), so tinting it
     * toward the icon's navy tints every component at once. Kept low in
     * saturation: the mock windows are macOS windows, and a saturated navy
     * would stop reading as one beside the real screenshots.
     */
    dark: [
      '#dde3ee',
      '#bcc6d8',
      '#93a1ba',
      '#6d7b95',
      '#414d66',
      '#333e55',
      '#273146',
      '#1d2539',
      '#161d2e',
      '#0f1523',
    ],
  },
  headings: {
    fontWeight: '600',
  },
  defaultRadius: 'md',
});
