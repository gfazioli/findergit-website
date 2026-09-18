#!/usr/bin/env node
/**
 * Full-page screenshots of a URL in light and dark, through Chrome's DevTools
 * protocol. No dependencies: Node 22+ ships a WebSocket client.
 *
 *   node scripts/shot.mjs <url> <out-prefix> [--width 1440] [--schemes light,dark]
 *
 * Writes <out-prefix>-light.png and <out-prefix>-dark.png.
 *
 * Why not `chrome --headless --screenshot`, which needs no script at all:
 *
 * - It captures the WINDOW, not the page. You guess a height, and a page
 *   taller than the guess is silently cut; sips then crops from the CENTRE
 *   when its offset is 0, which hands you the same middle band twice.
 *   Here the clip is the document's own height from Page.getLayoutMetrics.
 * - It cannot choose the colour scheme. This site defaults to dark through
 *   Mantine, not through prefers-color-scheme, so emulating the media
 *   feature changes nothing: the light rendering is reachable only by
 *   writing Mantine's localStorage key before the page loads. A capture that
 *   can only ever show one scheme is a check that measured half of it.
 * - The Scene backgrounds are `lazy` and paint on intersection. A capture
 *   straight after load shows blank bands; this scrolls the page once so
 *   every observer fires, then scrolls back before capturing.
 *
 * Chrome runs with a throwaway profile under /tmp: it never touches the
 * user's own session or storage.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MANTINE_KEY = 'mantine-color-scheme-value';

const [url, prefix, ...rest] = process.argv.slice(2);
if (!url || !prefix) {
  console.error(
    'usage: node scripts/shot.mjs <url> <out-prefix> [--width 1440] [--schemes light,dark]'
  );
  process.exit(2);
}
const width = Number(flag('--width') ?? 1440);
const schemes = (flag('--schemes') ?? 'light,dark').split(',');
const find = flag('--find');

function flag(name) {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
}

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

// Chrome prints the endpoint it picked to stderr; port 0 avoids colliding
// with anything else listening.
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (chunk) => {
    buf += chunk;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  chrome.on('exit', (code) => reject(new Error(`Chrome exited early (${code})`)));
  setTimeout(() => reject(new Error('Chrome did not announce DevTools within 15s')), 15000);
});

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = () => reject(new Error(`cannot connect to ${wsUrl}`));
});

let nextId = 1;
const pending = new Map();
const listeners = new Set();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(`${msg.error.message} (${msg.error.code})`)) : resolve(msg.result);
  } else if (msg.method) {
    for (const fn of listeners) fn(msg);
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
    { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 },
    sessionId
  );

  for (const scheme of schemes) {
    // Both routes to a scheme, because either may be the one a page honours:
    // the media feature for sites on `auto`, the storage key for this one.
    await send(
      'Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-color-scheme', value: scheme }] },
      sessionId
    );
    const origin = new URL(url).origin;
    const loaded = waitFor('Page.loadEventFired', sessionId);
    await send('Page.navigate', { url: origin + '/__shot_probe__' }, sessionId);
    await loaded;
    await send(
      'Runtime.evaluate',
      {
        expression: `localStorage.setItem(${JSON.stringify(MANTINE_KEY)}, ${JSON.stringify(scheme)})`,
      },
      sessionId
    );

    const loaded2 = waitFor('Page.loadEventFired', sessionId);
    await send('Page.navigate', { url }, sessionId);
    await loaded2;
    await sleep(800);

    // Wake every lazy observer, then return to the top before capturing.
    await send(
      'Runtime.evaluate',
      {
        expression: `(async () => {
          const h = document.documentElement.scrollHeight;
          for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 400));
          return h;
        })()`,
        awaitPromise: true,
      },
      sessionId
    );

    const { contentSize } = await send('Page.getLayoutMetrics', {}, sessionId);
    const height = Math.ceil(contentSize.height);
    const { data } = await send(
      'Page.captureScreenshot',
      {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      },
      sessionId
    );
    const file = `${prefix}-${scheme}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    const applied = await send(
      'Runtime.evaluate',
      {
        expression: `document.documentElement.getAttribute('data-mantine-color-scheme')`,
        returnByValue: true,
      },
      sessionId
    );
    console.log(`${file}  ${width}x${height}  data-mantine-color-scheme=${applied.result.value}`);

    // `--find "<text>"`: the document y of the first element whose own text
    // contains it, so a band of the capture can be cut where a section
    // actually is instead of where it is guessed to be.
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
  }
} finally {
  ws.close();
  // Wait for Chrome to be gone before removing its profile: killing it and
  // deleting the directory in the same tick raced its shutdown and failed
  // with ENOTEMPTY after every capture had already been written.
  const gone = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await gone;
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
