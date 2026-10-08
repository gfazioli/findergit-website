import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import config from '@/config';
import { theme } from '../../theme';
import { DirectoryBadges, ListedOn } from './DirectoryBadges';

const PLACEMENTS = ['hero', 'footer'] as const;

/**
 * Rendered to a string, as the server sends it: a directory that verifies its
 * badge fetches the home page, and runs none of its JavaScript.
 */
function served(node: ReactNode) {
  return renderToString(
    <MantineProvider theme={theme} env="test">
      {node}
    </MantineProvider>
  );
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

function anchors(html: string) {
  return html.match(/<a\s[^>]*>/g) ?? [];
}

describe('DirectoryBadges', () => {
  it('serves one link per directory, in config order, each in its place', () => {
    for (const placement of PLACEMENTS) {
      const hrefs = anchors(served(<DirectoryBadges placement={placement} />)).map((a) =>
        attr(a, 'href')?.replace(/&amp;/g, '&')
      );
      expect(hrefs).toEqual(
        config.directoryBadges
          .filter((badge) => badge.placement === placement)
          .map((badge) => badge.href)
      );
    }
  });

  it('keeps Product Hunt alone under the hero, and the rest in the footer', () => {
    // The user, 2026-10-08: the hero was getting crowded with badges.
    const names = (placement: string) =>
      config.directoryBadges.filter((b) => b.placement === placement).map((b) => b.name);
    expect(names('hero')).toEqual(['Product Hunt']);
    expect(names('footer')).toEqual(
      config.directoryBadges.map((b) => b.name).filter((name) => name !== 'Product Hunt')
    );
  });

  it('marks no link in a way that a backlink check refuses', () => {
    for (const placement of PLACEMENTS) {
      for (const anchor of anchors(served(<DirectoryBadges placement={placement} />))) {
        expect(attr(anchor, 'rel')).not.toMatch(/nofollow|sponsored|ugc/);
      }
    }
  });

  it('keeps every badge out of the preload queue', () => {
    // renderToString emits React's image preloads too, a fragment included:
    // with the badges eager, this string starts with one per badge.
    for (const placement of PLACEMENTS) {
      expect(served(<DirectoryBadges placement={placement} />)).not.toContain('rel="preload"');
    }
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
    for (const placement of PLACEMENTS) {
      const badges = config.directoryBadges.filter((badge) => badge.placement === placement);
      const images = served(<DirectoryBadges placement={placement} />).match(/<img\s[^>]*>/g) ?? [];
      expect(images).toHaveLength(badges.length);
      images.forEach((img, i) => {
        expect(attr(img, 'loading')).toBe('lazy');
        expect(attr(img, 'width')).toBe(String(badges[i].width));
        expect(attr(img, 'height')).toBe(String(badges[i].height));
        expect(attr(img, 'alt')).toBe(badges[i].alt.replace(/'/g, '&#x27;'));
      });
    }
  });

  it("labels the footer's row and serves its badges", () => {
    const html = served(<ListedOn />);
    expect(html).toContain('Listed on');
    expect(anchors(html)).toHaveLength(
      config.directoryBadges.filter((badge) => badge.placement === 'footer').length
    );
  });
});
