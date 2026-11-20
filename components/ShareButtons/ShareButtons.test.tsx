import { usePathname } from 'next/navigation';
import config from '@/config';
import { render, screen } from '@/test-utils';
import { ShareButtons } from './ShareButtons';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

const pathnameMock = usePathname as jest.MockedFunction<typeof usePathname>;

/** The page address each share link carries, as the visitor would post it. */
function sharedUrls() {
  return screen.getAllByRole('link', { name: /^Share on / }).map((link) => {
    const params = new URL(link.getAttribute('href')!).searchParams;
    // Bluesky carries the address at the end of its post text.
    return params.get('url') ?? params.get('u') ?? params.get('text')!.split(' ').pop();
  });
}

describe('ShareButtons', () => {
  it.each([
    // On Vercel the home page, regenerated on a timer, reads `/index`.
    ['/index', '/'],
    ['/docs/index', '/docs'],
    ['/docs/release-notes', '/docs/release-notes'],
    [null, '/'],
  ])('shares the pathname %p as %p', (pathname, path) => {
    pathnameMock.mockReturnValue(pathname as string);
    render(<ShareButtons />);

    const urls = sharedUrls();
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls)).toEqual(new Set([new URL(path, config.metadata.metadataBase).href]));
  });
});
