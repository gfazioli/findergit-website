import config from '@/config';

/**
 * The FinderGit Tutorials on the app's YouTube channel, by their number.
 *
 * A docs page shows one with `<Tutorial n={1} />`, in the section that covers
 * what the film does. A film is listed here on the day it goes out, with its
 * page: before `published` it is private, and an embed of it says "Video
 * unavailable". `Tutorial.test.tsx` refuses a page that embeds one whose time
 * has not come, and a page that names a film not listed here fails the build.
 *
 * The series follows the docs' own order, from Getting Started, and a film
 * says its number aloud: the numbers are not the order the films come out in
 * (04 was made first), so the list may have gaps.
 *
 * `title` is the film's title on YouTube without the "| FinderGit Tutorial NN"
 * suffix; `seconds` is the length of the delivered mp4 to a tenth, which
 * YouTube rounds two ways: its player shows 63.4 s as 1:04, its data says 63
 * (checked on a Netfox tutorial, 2026-11-11). So the caption rounds up, as the
 * player the reader is about to start does, and the VideoObject down; the
 * poster is the film's opening card, 1280x720, in `public/tutorials/`.
 */
export interface TutorialFilm {
  n: number;
  /** The YouTube video id. */
  id: string;
  title: string;
  /** What the film shows, for the VideoObject's description. */
  summary: string;
  seconds: number;
  /** When the film went (or goes) public, with its offset. */
  published: string;
}

/** Where the series is: the channel, until the films have a playlist of their own. */
export const TUTORIALS_PLAYLIST = config.community.youtube;

/** None is on YouTube yet. 01 and 04 are rendered, and their posters are in `public/tutorials/`. */
export const TUTORIALS: TutorialFilm[] = [];

/** The film numbered `n`; a number with no film is a typo in a page, or a film not out yet, and fails the build. */
export function tutorial(n: number): TutorialFilm {
  const film = TUTORIALS.find((t) => t.n === n);
  if (!film) {
    throw new Error(`No FinderGit tutorial numbered ${n}`);
  }
  return film;
}

/** `01`, as the films and their posters are numbered. */
export const twoDigits = (n: number) => String(n).padStart(2, '0');

/** `1:04` for 63.4 s, as YouTube's player writes a length: rounded up. */
export const clock = (seconds: number) => {
  const whole = Math.ceil(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

/** `PT1M3S` for 63.4 s, as schema.org wants a length and YouTube's data gives it: rounded down. */
export const isoDuration = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `PT${Math.floor(whole / 60)}M${whole % 60}S`;
};
