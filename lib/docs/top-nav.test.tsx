import { getTopNav } from './top-nav';
import { isMenu } from './types';

describe('getTopNav', () => {
  const nav = getTopNav({
    index: { display: 'hidden' },
    docs: { type: 'page', title: 'Documentation' },
    about: { type: 'page', title: 'About', href: 'https://example.com/' },
    community: {
      type: 'menu',
      title: 'Community',
      items: {
        blog: { title: 'Blog', href: 'https://blog.example.com/' },
        local: { title: 'Local' },
      },
    },
    plain: 'A string entry is a sidebar title, not a header link',
  });

  it('keeps pages and menus, in order, and drops hidden and plain entries', () => {
    expect(nav.map((entry) => entry.key)).toEqual(['docs', 'about', 'community']);
  });

  it('links a page to /<key> unless it has an href, and opens external links in a new window', () => {
    expect(nav[0]).toMatchObject({ href: '/docs', newWindow: false });
    expect(nav[1]).toMatchObject({ href: 'https://example.com/', newWindow: true });
  });

  it('lists a menu’s items', () => {
    const menu = nav[2];
    expect(isMenu(menu)).toBe(true);
    if (isMenu(menu)) {
      expect(menu.items).toEqual([
        { key: 'blog', title: 'Blog', href: 'https://blog.example.com/', newWindow: true },
        { key: 'local', title: 'Local', href: '/local', newWindow: false },
      ]);
    }
  });
});
