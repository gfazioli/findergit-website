'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import NextImage from 'next/image';
import { docsSizes } from '@/components/DocsImage/DocsImage';

/** The player's state for "playing", in its messages. */
const PLAYING = 1;

/**
 * How long after the film starts a captions module still counts as loaded by
 * the player itself. In Dia it was there before the film played (2026-11-11);
 * this covers a slower load, and a module that comes later is the viewer's.
 */
const CAPTIONS_GRACE_MS = 3000;

interface TutorialPlayerProps {
  /** The YouTube video id. */
  id: string;
  /** The film's thumbnail, in `public/`. */
  poster: string;
  /** The film's number, title and length: the player's title, and the poster link says Play it. */
  name: string;
}

/**
 * The film's frame: its poster with a Play control until the reader asks for
 * it, then YouTube's player in its place, already playing.
 *
 * Nothing from YouTube loads before that click: no script, no cookie, no
 * request, so a docs page costs what it did and tells YouTube nothing about
 * who read it. The player comes from youtube-nocookie.com, which sets no
 * cookie until the film plays.
 *
 * The poster is a link to the film on YouTube, so without scripts, or with a
 * modifier held (a new tab, a new window), the reader gets the film there.
 * Its words are the image's `alt`, which is the link's name for a screen
 * reader and for the link-text audit; the Play pill says it to the eye.
 *
 * Its captions start off. The words are already in the picture, burned in,
 * and YouTube turns its own caption track on by itself for some viewers (it
 * did in a browser whose language is Italian, 2026-11-11: by language or by
 * the viewer's own setting, YouTube does not say), so the same line showed
 * twice, one above the other. No embed parameter turns
 * captions off (`cc_load_policy` only forces them on), so once the film is
 * playing, and once the player says its captions module is loaded (unloading
 * one that is not there yet does nothing), the page asks the player to unload
 * it, once, through the player's own message channel (`enablejsapi=1`; the
 * handshake is the `listening` message the IFrame API sends, repeated until
 * the player answers). The viewer's CC button still brings them back. Only messages
 * from this frame's own window are read.
 *
 * Focus moves into the player once it is there, so the keyboard reader who
 * pressed Return is not left on a control that has gone. `referrerPolicy`
 * keeps the origin YouTube now requires of an embed (it refuses one without,
 * "Error 153").
 */
export function TutorialPlayer({ id, poster, name }: TutorialPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const player = frame.current;
    if (!playing || !player) {
      return;
    }
    player.focus();

    const say = (message: object) =>
      player.contentWindow?.postMessage(
        JSON.stringify({ ...message, id: 1, channel: 'widget' }),
        '*'
      );
    let answered = false;
    let captionsOff = false;
    let captionsLoaded = false;
    let playingSince: number | undefined;
    const knock = window.setInterval(() => say({ event: 'listening' }), 250);
    const hear = (event: MessageEvent) => {
      if (event.source !== player.contentWindow || typeof event.data !== 'string') {
        return;
      }
      let data: {
        event?: string;
        info?: { playerState?: number; namespaces?: string[] } | null;
      };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!answered) {
        answered = true;
        window.clearInterval(knock);
      }
      if (captionsOff) {
        return;
      }
      if (
        data.event === 'infoDelivery' &&
        data.info?.playerState === PLAYING &&
        playingSince === undefined
      ) {
        playingSince = performance.now();
      }
      if (data.event === 'apiInfoDelivery' && data.info?.namespaces?.includes('captions')) {
        // Loaded on its own, before the film plays or just after it starts: a
        // module that arrives later is the viewer pressing CC, and stays.
        captionsLoaded =
          playingSince === undefined || performance.now() - playingSince < CAPTIONS_GRACE_MS;
      }
      if (captionsLoaded && playingSince !== undefined) {
        captionsOff = true;
        say({ event: 'command', func: 'unloadModule', args: ['captions'] });
      }
    };
    window.addEventListener('message', hear);
    return () => {
      window.clearInterval(knock);
      window.removeEventListener('message', hear);
    };
  }, [playing]);

  const play = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return; // the browser opens YouTube, as the reader asked
    }
    event.preventDefault();
    setPlaying(true);
  };

  return (
    <div className="fg-tutorial-frame">
      {playing ? (
        <iframe
          ref={frame}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
          title={name}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <a
          className="fg-tutorial-poster"
          href={`https://www.youtube.com/watch?v=${id}`}
          onClick={play}
        >
          <NextImage src={poster} alt={`Play ${name}`} fill sizes={docsSizes()} loading="lazy" />
          <span className="fg-tutorial-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
            Play
          </span>
        </a>
      )}
    </div>
  );
}
