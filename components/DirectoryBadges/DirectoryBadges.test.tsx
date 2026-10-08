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

  it("loads each badge image from its directory's own domain", () => {
    // A directory's verifier looks for its badge image on the page, not only
    // the link: LaunchNest refused a copy served from this site ("We couldn't
    // find the badge image on that page", 2026-10-08).
    const domain = (url: string) => new URL(url).hostname.split('.').slice(-2).join('.');
    for (const badge of config.directoryBadges) {
      expect(badge.src).toMatch(/^https:\/\//);
      expect(domain(badge.src)).toBe(domain(badge.href));
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
