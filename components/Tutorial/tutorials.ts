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

/**
 * Where the series is: the FinderGit Tutorials playlist, in the films' own order.
 * The id is whole: this channel's playlist ids are 13 characters, not the usual 34.
 */
export const TUTORIALS_PLAYLIST = 'https://www.youtube.com/playlist?list=PLJUGERD4xMGs';

/** 04 is rendered too, with its poster in `public/tutorials/`, and waits for its day. */
export const TUTORIALS: TutorialFilm[] = [
  {
    n: 1,
    id: 'xv-upkW-cBk',
    title: 'Add all your Git repositories at once',
    summary:
      'FinderGit starts empty. In this first FinderGit tutorial, add the folder where your projects live as a root folder, see every Git repository inside it with its branch and its status, and open All Repositories for the whole list.',
    seconds: 54.9,
    published: '2026-11-11T17:22:47+01:00',
  },
];

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
