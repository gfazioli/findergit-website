#!/usr/bin/env node
/**
 * Screenshots of a URL through Chrome's DevTools protocol. No dependencies:
 * Node 22+ ships a WebSocket client.
 *
 *   node scripts/shot.mjs <url> <out-prefix> [--width 1440] [--height 900]
 *                                            [--at 0,0.25,0.6] [--find "text"]
 *                                            [--eval "<expression>"]
 *                                            [--click "<selector>" ...] [--between 1500]
 *                                            [--rate 0.1]
 *                                            [--frames 12 --every 250] [--no-wake]
 *                                            [--prompt] [--reduce]
 *
 * With no `--at` it writes ONE full-page `<prefix>.png`. With `--at` it writes
 * one VIEWPORT capture per fraction of the scrollable height:
 * `<prefix>-at-<fraction>.png`.
 *
 * This file started here, grew the `--at`, `--eval` and film-strip modes on
 * lancetta-website (for a pinned hero and then for its scroll reveals), and
 * came back on 2026-09-28 with the reveals and the mascot, which cannot be
 * seen without them. A full-page capture shows the END of every animation, and
 * a capture that can only ever show the end is a check that measured one frame.
 *
 * Three reasons not to use `chrome --headless --screenshot`, all measured here
 * first:
 *
 * - It captures the WINDOW, not the page. You guess a height, and a page
 *   taller than the guess is silently cut; `sips` then crops from the CENTRE
 *   when its offset is 0, which hands you the same middle band twice. Here the
 *   full-page clip is the document's own height from Page.getLayoutMetrics.
 * - It cannot choose the colour scheme. This site is dark-only now, so the
 *   storage key is written to `dark` defensively rather than looped over: a
 *   visitor arriving with `light` left in storage from the old switch is
 *   exactly the state worth being able to photograph.
 * - The Scene backgrounds are `lazy` and paint on intersection. A capture
 *   straight after load shows blank bands; this scrolls the page once so every
 *   observer fires, then goes where it was asked to.
 *
 * `--eval` reads the page at each `--at` position (after the strip, with
 * `--frames`, and once after a full-page capture) instead of, or as well as,
 * photographing it — the geometry a capture cannot give you as a number. Use
 * THIS rather than `scripts/pageeval.swift` whenever a transition is involved:
 * that one is a WKWebView whose animation clock never advances, so a property
 * under `transition:` is frozen at the value it had when the transition began.
 * It answered `grid-template-rows: 354px 435px` for the hero on 2026-09-19
 * while the element's own inline `--copy-h` said 199px, and three frames
 * measured identical because all three were frozen at the same start — a
 * check that cannot tell the fix from the bug it was testing.
 *
 * Chrome runs with a throwaway profile under /tmp: it never touches the user's
 * own session or storage.
 *
 * MOTION (2026-09-28, for the scroll reveals and the mascot). Three flags turn
 * a capture into a film strip:
 *
 * - `--frames N --every MS` writes N viewport captures instead of one, MS apart,
 *   starting the moment the page got where it was sent (`-f00.png`, `-f01.png`
 *   ...): at each `--at` fraction, or after `--click`.
 * - `--rate R` slows every CSS animation, transition and Web Animation in the
 *   page by R (DevTools' Animation.setPlaybackRate). A capture takes 130-175 ms
 *   at 1440x900, so a 0.3 s spring is two frames at full speed and about
 *   twenty at 0.1. It does NOT slow a `setTimeout`: the mascot's phases are
 *   timers, so under `--rate` its walk animation runs slow while the timer
 *   that ends the walk fires on the wall clock.
 * - `--click "<selector>"` clicks the first match before the frames start: the
 *   mascot (`button[aria-label^="Show the next"]`) turns the hero carousel.
 *   Give it more than once and each is clicked in turn, `--between MS` apart
 *   (1500 by default, wall clock, so allow for `--rate`).
 *
 * And `--no-wake`, without which none of that can see a reveal: the default
 * scrolls the whole page once to wake the lazy backgrounds, which is exactly
 * what fires every one-shot reveal before the first frame.
 *
 * The newsletter prompt is stored as already dismissed, because it opens once
 * the page has scrolled 1200px -- over the hero's carousel, the mascot and
 * every section below, dimmed and blurred behind its overlay, in the first
 * strip filmed on 2026-09-28. `--prompt` leaves it as a first visit gets it.
 *
 * `--reduce` emulates Reduce Motion (`prefers-reduced-motion: reduce`): the
 * page is then simply there, and the mascot arrives already pointing.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MANTINE_KEY = 'mantine-color-scheme-value';
/** `NewsletterModal`'s flag; `useLocalStorage` stores the boolean as JSON. */
const PROMPT_KEY = 'findergit-newsletter-prompt-dismissed';

const [url, prefix, ...rest] = process.argv.slice(2);

function flag(name) {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
}

/** Every value of a flag that may repeat, in order. */
function flags(name) {
  return rest.flatMap((value, i) => (value === name ? [rest[i + 1]] : []));
}

if (!url || !prefix) {
  console.error(
    'usage: node scripts/shot.mjs <url> <out-prefix> [--width 1440] [--height 900] [--at 0,0.5] [--find "text"]'
  );
  process.exit(2);
}

const width = Number(flag('--width') ?? 1440);
const height = Number(flag('--height') ?? 900);
const find = flag('--find');
const evaluate = flag('--eval');
const clicks = flags('--click');
const between = Number(flag('--between') ?? 1500);
const rate = Number(flag('--rate') ?? 1);
const frames = Number(flag('--frames') ?? 0);
const every = Number(flag('--every') ?? 200);
const wake = !rest.includes('--no-wake');
const prompt = rest.includes('--prompt');
const reduce = rest.includes('--reduce');
const at = flag('--at')
  ?.split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value));

const profile = mkdtempSync(join(tmpdir(), 'shot-profile-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);

// Stops Chrome and removes its profile, waiting for Chrome to be gone first:
// killing it and deleting the directory in the same tick raced its shutdown and
// failed with ENOTEMPTY after every capture had already been written. A Chrome
// that could not be spawned at all has no pid and never emits `exit`, so there
// is nothing to wait for.
async function stopChrome() {
  if (chrome.pid !== undefined && chrome.exitCode === null && chrome.signalCode === null) {
    const gone = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await gone;
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

// Chrome prints the endpoint it picked to stderr; port 0 avoids colliding with
// anything else listening. The start is cleaned up too: a Chrome that never
// announced itself used to be left running, with its profile, by a throw that
// came before the try below. And the deadline is cleared once it is met, or it
// kept Node alive for the whole 15 seconds after a capture that took one.
let ws;
try {
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const deadline = setTimeout(
      () => reject(new Error('Chrome did not announce DevTools within 15s')),
      15000
    );
    chrome.stderr.on('data', (chunk) => {
      buf += chunk;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(deadline);
        resolve(m[1]);
      }
    });
    chrome.on('exit', (code) => {
      clearTimeout(deadline);
      reject(new Error(`Chrome exited early (${code})`));
    });
    // A binary that is missing or not executable emits `error`, not `exit`, and
    // an `error` nobody listens for kills Node before the cleanup below runs.
    chrome.on('error', (err) => {
      clearTimeout(deadline);
      reject(new Error(`cannot start Chrome: ${err.message}`));
    });
  });
  ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error(`cannot connect to ${wsUrl}`));
  });
} catch (err) {
  ws?.close();
  await stopChrome();
  throw err;
}

let nextId = 1;
const pending = new Map();
const listeners = new Set();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) {
      reject(new Error(`${msg.error.message} (${msg.error.code})`));
    } else {
      resolve(msg.result);
    }
  } else if (msg.method) {
    for (const fn of listeners) {
      fn(msg);
    }
  }
};

function send(method, params = {}, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitFor(method, sessionId) {
  return new Promise((resolve) => {
    const fn = (msg) => {
      if (msg.method === method && msg.sessionId === sessionId) {
        listeners.delete(fn);
        resolve(msg.params);
      }
    };
    listeners.add(fn);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile: width < 600 },
    sessionId
  );
  await send(
    'Emulation.setEmulatedMedia',
    {
      features: [
        { name: 'prefers-color-scheme', value: 'dark' },
        { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' },
      ],
    },
    sessionId
  );

  const origin = new URL(url).origin;
  const probed = waitFor('Page.loadEventFired', sessionId);
  await send('Page.navigate', { url: `${origin}/__shot_probe__` }, sessionId);
  await probed;
  await send(
    'Runtime.evaluate',
    {
      expression: `localStorage.setItem(${JSON.stringify(MANTINE_KEY)}, "dark");${
        prompt ? '' : ` localStorage.setItem(${JSON.stringify(PROMPT_KEY)}, "true");`
      }`,
    },
    sessionId
  );

  const loaded = waitFor('Page.loadEventFired', sessionId);
  await send('Page.navigate', { url }, sessionId);
  await loaded;
  await sleep(900);

  if (rate !== 1) {
    await send('Animation.enable', {}, sessionId);
    await send('Animation.setPlaybackRate', { playbackRate: rate }, sessionId);
  }

  // Wake every lazy observer, then come back to the top -- unless the reveals
  // are what is being photographed (`--no-wake`).
  const woken = await send(
    'Runtime.evaluate',
    {
      expression: `(async () => {
        const h = document.documentElement.scrollHeight;
        if (${wake}) {
          // Half a viewport a step, so every element is inside the viewport at
          // some stop: 700px steps skipped short elements on a phone-sized one.
          const step = Math.max(100, Math.floor(window.innerHeight / 2));
          for (let y = 0; y < h; y += step) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50)); }
          window.scrollTo({ top: 0, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 500));
        }
        return h;
      })()`,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId
  );

  async function capture(file, clip) {
    const { data } = await send(
      'Page.captureScreenshot',
      { format: 'png', captureBeyondViewport: Boolean(clip), ...(clip ? { clip } : {}) },
      sessionId
    );
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }

  // `--frames`: a strip of viewport captures from this moment on. The time
  // printed is MEASURED, when each capture was asked for: one takes about
  // 100 ms, so an `--every` shorter than that falls behind its plan. Under
  // `--rate` the page's own clock is beside it.
  async function strip(stem) {
    const t0 = Date.now();
    for (let k = 0; k < frames; k++) {
      const started = Date.now();
      const file = await capture(`${stem}-f${String(k).padStart(2, '0')}.png`);
      const t = started - t0;
      console.log(`${file}  t=${t}ms${rate === 1 ? '' : `  page=${Math.round(t * rate)}ms`}`);
      await sleep(Math.max(0, every - (Date.now() - started)));
    }
  }

  // `--eval`, printed under the capture (or the strip) it belongs to.
  async function readPage() {
    if (!evaluate) {
      return;
    }
    const read = await send(
      'Runtime.evaluate',
      // `awaitPromise`, so an expression can wait for a transition to land.
      { expression: evaluate, awaitPromise: true, returnByValue: true },
      sessionId
    );
    console.log(`  eval: ${JSON.stringify(read.result.value ?? read.result.description)}`);
  }

  for (const [n, click] of clicks.entries()) {
    if (n > 0) {
      await sleep(between);
    }
    const clicked = await send(
      'Runtime.evaluate',
      {
        expression: `(() => { const el = document.querySelector(${JSON.stringify(click)}); if (!el) return false; el.click(); return true; })()`,
        returnByValue: true,
      },
      sessionId
    );
    if (!clicked.result.value) {
      throw new Error(`--click: nothing matches ${click}`);
    }
  }

  const scheme = await send(
    'Runtime.evaluate',
    {
      expression: `document.documentElement.getAttribute('data-mantine-color-scheme')`,
      returnByValue: true,
    },
    sessionId
  );

  if (at?.length) {
    for (const fraction of at) {
      // Told where to go as a FRACTION of the scrollable range, and it reports
      // the pixel it landed on: a stage that pins for four viewports makes
      // "25%" meaningless without the number beside it.
      const where = await send(
        'Runtime.evaluate',
        {
          expression: `(async () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const y = Math.round(max * ${fraction});
            // 'instant', because this site sets html { scroll-behavior: smooth }
            // and a smooth scroll is an ANIMATION: the capture then lands
            // wherever it had got to after the wait, which depends on where it
            // started. Two visits to the same fraction came out 78px apart and
            // looked like the page had changed under the reader.
            window.scrollTo({ top: y, behavior: 'instant' });
            // A strip starts at once; a single capture waits for things to land.
            await new Promise(r => setTimeout(r, ${frames > 0 ? 0 : 900}));
            return [window.scrollY, max];
          })()`,
          awaitPromise: true,
          returnByValue: true,
        },
        sessionId
      );
      const [y, max] = where.result.value;
      if (frames > 0) {
        console.log(`at ${fraction}: y=${y}/${max}`);
        await strip(`${prefix}-at-${fraction}`);
      } else {
        const file = await capture(`${prefix}-at-${fraction}.png`);
        console.log(`${file}  ${width}x${height}  y=${y}/${max}`);
      }
      await readPage();
    }
  } else if (frames > 0) {
    await strip(prefix);
    await readPage();
  } else {
    const { contentSize } = await send('Page.getLayoutMetrics', {}, sessionId);
    const full = Math.ceil(contentSize.height);
    const file = await capture(`${prefix}.png`, { x: 0, y: 0, width, height: full, scale: 1 });
    console.log(`${file}  ${width}x${full}`);
    await readPage();
  }

  console.log(`  scheme=${scheme.result.value}  document height=${woken.result.value}`);

  // `--find "<text>"`: the document y of the first element whose OWN text
  // contains it, so a band of a capture can be cut where a section actually is
  // instead of where it is guessed to be.
  if (find) {
    const pos = await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const needle = ${JSON.stringify(find)};
          for (const el of document.querySelectorAll('h1,h2,h3,p,span,div')) {
            if (el.children.length === 0 && el.textContent.includes(needle)) {
              return Math.round(el.getBoundingClientRect().top + window.scrollY);
            }
          }
          return -1;
        })()`,
        returnByValue: true,
      },
      sessionId
    );
    console.log(`  "${find}" at y=${pos.result.value}`);
  }
} finally {
  ws.close();
  await stopChrome();
}
