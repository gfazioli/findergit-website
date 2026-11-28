import { toRouterUrl } from './pagefind';

describe('toRouterUrl', () => {
  it('drops the .html of a server build, keeping the fragment', () => {
    expect(toRouterUrl('/docs/api.html#errors')).toBe('/docs/api#errors');
  });

  it('keeps the trailing slash of a static export', () => {
    expect(toRouterUrl('/docs/guides/search/#building-the-index')).toBe(
      '/docs/guides/search/#building-the-index'
    );
  });

  it('touches only the path: a fragment may contain ".html"', () => {
    expect(toRouterUrl('/docs/api#index.html')).toBe('/docs/api#index.html');
  });
});
