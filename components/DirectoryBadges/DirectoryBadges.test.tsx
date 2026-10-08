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

  it('keeps every badge out of the preload queue, at its own aspect ratio', () => {
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
