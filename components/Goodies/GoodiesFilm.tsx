'use client';

import { useEffect, useRef, useState } from 'react';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import { useReducedMotion } from '@mantine/hooks';
import classes from './Goodies.module.css';

/** How much of the film must be on screen for it to play. */
const VISIBLE = 0.25;

/**
 * The pack's 36-second film, an exact loop. It plays silent, and it reads
 * without its sound: every scene has its headline in the picture. The voice
 * and the music are there for whoever asks, with the pill on the film.
 *
 * Nothing of the film is fetched before it plays (`preload="none"`: with
 * `metadata` a phone that never scrolled to it had already taken 192 KiB), only
 * its poster. It plays only while at least a quarter of it is on screen, so a
 * reader who scrolled past is not decoding video at rest, and never on its own
 * for a visitor who asked for reduced motion: they get the poster and the
 * browser's controls. Without scripts the poster stays, which is the film's own
 * end card and its first frame.
 *
 * Asking for the sound starts the film again from the top, so the narrator
 * begins at the first line and not in the middle of one. The sound goes off
 * again when the film leaves the screen: coming back to it never plays aloud
 * on its own.
 *
 * On a phone the pill is its icon alone, its words kept for a screen reader:
 * the film is 200px tall there, and the words would cover its end card.
 *
 * The pill is drawn only while it works: once the film is playing by this
 * component's hand, and never beside the browser's own controls (reduced
 * motion, or a browser that refused to play), which have the volume.
 *
 * The preference is read on the first render (`getInitialValueInEffect: false`):
 * nothing in the markup depends on it, and read in an effect it would let the
 * film start for a moment before stopping.
 */
export function GoodiesFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion(false, { getInitialValueInEffect: false });
  const [pill, setPill] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }
    video.controls = reduce;
    if (reduce) {
      video.pause(); // the visitor plays it with the controls, or not at all
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // `threshold` decides when this runs, not `isIntersecting`: a sliver on screen is still
        // "intersecting" as the film leaves, so the ratio decides.
        if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE) {
          video.play().then(
            () => setPill(true),
            // A browser that refuses (low-power mode) leaves the poster and the controls.
            () => {
              video.controls = true;
              setPill(false);
            }
          );
        } else {
          video.pause();
          video.muted = true;
          setSound(false);
        }
      },
      { threshold: VISIBLE }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduce]);

  const toggleSound = () => {
    const video = ref.current;
    if (!video) {
      return;
    }
    if (sound) {
      video.muted = true;
      setSound(false);
      return;
    }
    video.currentTime = 0;
    video.muted = false;
    setSound(true);
    video.play().catch(() => {
      // refused aloud: back to the silent film
      video.muted = true;
      setSound(false);
    });
  };

  return (
    <div className={classes.filmFrame}>
      <video
        ref={ref}
        className={`${classes.picture} ${classes.shadowed} ${classes.film}`}
        src="/goodies/goodies-film.mp4"
        poster="/goodies/goodies-film-poster.jpg"
        width={1280}
        height={720}
        muted
        loop
        playsInline
        preload="none"
        aria-label="The FinderGit Goodies film: the two screen savers, the five wallpapers, then the iPhone wallpapers, a video-call background and the pixel folder emoji"
      />
      {pill && !reduce && (
        <button type="button" className={classes.sound} onClick={toggleSound}>
          {sound ? <IconVolumeOff size={18} aria-hidden /> : <IconVolume size={18} aria-hidden />}
          <span className={classes.soundLabel}>{sound ? 'Mute' : 'Play with sound'}</span>
        </button>
      )}
    </div>
  );
}
