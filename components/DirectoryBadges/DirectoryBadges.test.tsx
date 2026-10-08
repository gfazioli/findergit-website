import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import config from '@/config';
import { theme } from '../../theme';
import { DirectoryBadges } from './DirectoryBadges';

/**
 * Rendered to a string, as the server sends it: a directory that verifies its
 * badge fetches the home page, and runs none of its JavaScript.
 */
function served() {
  return renderToString(
    <MantineProvider theme={theme} env="test">
      <DirectoryBadges />
    </MantineProvider>
  );
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

describe('DirectoryBadges', () => {
  it('serves one link per directory, in config order, each to its listing', () => {
    const anchors = served().match(/<a\s[^>]*>/g) ?? [];
    expect(anchors.map((a) => attr(a, 'href')?.replace(/&amp;/g, '&'))).toEqual(
      config.directoryBadges.map((badge) => badge.href)
    );
  });

  it('marks no link in a way that a backlink check refuses', () => {
    for (const anchor of served().match(/<a\s[^>]*>/g) ?? []) {
      expect(attr(anchor, 'rel')).not.toMatch(/nofollow|sponsored|ugc/);
    }
  });

  it('keeps every badge out of the preload queue', () => {
    // renderToString emits React's image preloads too, a fragment included:
    // with the badges eager, this string starts with one per badge.
    expect(served()).not.toContain('rel="preload"');
  });

  it('finds every self-hosted badge in public/, drawn at its own aspect ratio', () => {
    // A missing file is a broken image that no build notices, and a ratio off
    // the viewBox draws the badge squashed.
    const local = config.directoryBadges.filter((badge) => badge.src.startsWith('/'));
    expect(local.length).toBeGreaterThan(0);
    for (const badge of local) {
      const svg = fs.readFileSync(path.join(process.cwd(), 'public', badge.src), 'utf8');
      const [, , w, h] = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? '').split(/[\s,]+/).map(Number);
      expect(w / h).toBeCloseTo(badge.width / badge.height, 1);
    }
  });

  it('draws each badge lazily, at the aspect ratio of its config', () => {
    const images = served().match(/<img\s[^>]*>/g) ?? [];
    expect(images).toHaveLength(config.directoryBadges.length);
    images.forEach((img, i) => {
      const badge = config.directoryBadges[i];
      expect(attr(img, 'loading')).toBe('lazy');
      expect(attr(img, 'width')).toBe(String(badge.width));
      expect(attr(img, 'height')).toBe(String(badge.height));
      expect(attr(img, 'alt')).toBe(badge.alt.replace(/'/g, '&#x27;'));
    });
  });
});
