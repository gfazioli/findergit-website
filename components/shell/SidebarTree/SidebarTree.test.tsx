import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { render } from '@/test-utils';
import type { DocsNode } from '@/lib/docs/types';
import { theme } from '@/theme';
import { SidebarTree } from './SidebarTree';

jest.mock('next/navigation', () => ({
  usePathname: () => '/docs',
}));

// next/link, reduced to what the sidebar hands it: the prefetch choice, as an attribute
jest.mock('next/link', () => {
  const Link = ({
    prefetch,
    ...props
  }: React.ComponentPropsWithoutRef<'a'> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  );
  return { __esModule: true, default: Link };
});

const tree: DocsNode[] = [
  { kind: 'page', key: 'index', title: 'Introduction', route: '/docs' },
  {
    kind: 'folder',
    key: 'guides',
    title: 'Guides',
    route: '',
    children: [
      {
        kind: 'folder',
        key: 'deep',
        title: 'Deep',
        route: '',
        children: [
          { kind: 'page', key: 'nested', title: 'Nested', route: '/docs/guides/deep/nested' },
        ],
      },
    ],
  },
];

describe('SidebarTree', () => {
  it("serves a closed folder's links in the HTML, for crawlers", () => {
    // MantineProvider without env="test": the server render a visitor or a crawler gets
    const html = renderToString(
      <MantineProvider theme={theme}>
        <SidebarTree tree={tree} defaultMenuCollapseLevel={1} />
      </MantineProvider>
    );
    expect(html).toContain('href="/docs/guides/deep/nested"');
  });

  it('turns prefetching off while the sidebar is hidden', () => {
    const { rerender } = render(<SidebarTree tree={tree} prefetch={false} />);
    const link = document.querySelector('a[href="/docs"]');
    expect(link).toHaveAttribute('data-prefetch', 'false');

    rerender(<SidebarTree tree={tree} />);
    expect(document.querySelector('a[href="/docs"]')).toHaveAttribute('data-prefetch', 'undefined');
  });
});
