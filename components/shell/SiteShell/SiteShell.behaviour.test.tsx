import config from '@/config';
import { render, screen, userEvent, within } from '@/test-utils';
import type { DocsNode, TopNavEntry } from '@/lib/docs/types';
import { SiteShell } from './SiteShell';

const mockSegment = jest.fn<string | null, []>(() => 'docs');

jest.mock('next/navigation', () => ({
  usePathname: () => '/docs',
  useSelectedLayoutSegment: () => mockSegment(),
  useRouter: () => ({ push: jest.fn() }),
}));

// The placement of the sidebar toggle, switched per test
const sidebarConfig = config.docs.sidebar as { toggle: 'header' | 'sidebar' };
// The colour-scheme switch at the foot of the sidebar, switched per test
const docsConfig = config.docs as { colorSchemeControl: boolean };

const tree: DocsNode[] = [{ kind: 'page', key: 'index', title: 'Introduction', route: '/docs' }];

// A same-page link, as a site's "Support → Sponsor" pointing at its footer's sponsors section
const nav: TopNavEntry[] = [
  {
    key: 'support',
    title: 'Support',
    items: [{ key: 'sponsor', title: 'Sponsor', href: '#sponsors', newWindow: false }],
  },
];

function renderShell() {
  render(
    <SiteShell
      tree={tree}
      nav={nav}
      docsFooter={<footer>Docs footer</footer>}
      siteFooter={<footer>Site footer</footer>}
    >
      <p>Page</p>
    </SiteShell>
  );
  return document.querySelector<HTMLElement>('.mantine-AppShell-navbar')!;
}

beforeEach(() => {
  mockSegment.mockReturnValue('docs');
  sidebarConfig.toggle = 'header';
  docsConfig.colorSchemeControl = true;
  window.localStorage.clear();
});

describe('SiteShell', () => {
  it('opens on a skip link to the main landmark', () => {
    renderShell();
    const focusable = document.querySelectorAll('a[href], button');
    expect(focusable[0]).toHaveAttribute('href', '#main-content');
    expect(document.querySelector('main')).toHaveAttribute('id', 'main-content');
  });

  it('closes the phone navbar when a link in it is followed, even to the same page', async () => {
    const navbar = renderShell();
    expect(navbar).toHaveAttribute('data-mobile-collapsed');

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(navbar).not.toHaveAttribute('data-mobile-collapsed');

    // A menu group is a button: it opens in place and keeps the navbar open
    await userEvent.click(within(navbar).getByRole('button', { name: /Support/ }));
    expect(navbar).not.toHaveAttribute('data-mobile-collapsed');

    // `hidden`: jsdom never ends Collapse's transition, so the group stays display: none here
    await userEvent.click(within(navbar).getByRole('link', { name: 'Sponsor', hidden: true }));
    expect(navbar).toHaveAttribute('data-mobile-collapsed');
  });

  it('renders a missing /docs page (the 404) as a page outside the docs', () => {
    // At /docs/missing the router renders the not-found segment, not the docs one
    mockSegment.mockReturnValue('/_not-found');
    const navbar = renderShell();

    expect(navbar).toHaveAttribute('data-desktop-collapsed');
    expect(screen.getByText('Site footer')).toBeInTheDocument();
    expect(screen.queryByText('Docs footer')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /the sidebar/ })).not.toBeInTheDocument();
  });

  it('keeps the sidebar toggle in the header by default', () => {
    const navbar = renderShell();
    const toggle = screen.getByRole('button', { name: 'Hide the sidebar' });
    expect(navbar).not.toContainElement(toggle);
  });

  it('puts the sidebar toggle at the foot of the sidebar, and back in the header once collapsed', async () => {
    sidebarConfig.toggle = 'sidebar';
    const navbar = renderShell();
    const header = document.querySelector<HTMLElement>('.mantine-AppShell-header')!;
    const foot = within(navbar).getByRole('button', { name: 'Hide the sidebar' });
    // The header's is always there, hidden by CSS while the sidebar is open
    const headerToggle = header.querySelector<HTMLElement>('[data-sidebar-toggle="header"]')!;
    expect(header).toHaveAttribute('data-toggle', 'sidebar');
    expect(header).not.toHaveAttribute('data-collapsed');

    // Pressed, the foot's goes out of view with the sidebar: the focus moves to the header's
    await userEvent.click(foot);
    expect(navbar).toHaveAttribute('data-desktop-collapsed');
    expect(header).toHaveAttribute('data-collapsed');
    expect(headerToggle).toHaveAccessibleName('Show the sidebar');
    expect(headerToggle).toHaveFocus();

    // And back
    await userEvent.click(headerToggle);
    expect(navbar).not.toHaveAttribute('data-desktop-collapsed');
    expect(foot).toHaveFocus();
  });

  it('offers the colour-scheme switch at the foot of the sidebar unless the site turns it off', () => {
    const navbar = renderShell();
    expect(within(navbar).getByRole('button', { name: 'Toggle color scheme' })).toBeInTheDocument();
  });

  it('drops the colour-scheme switch from the sidebar when config.docs.colorSchemeControl is false', () => {
    docsConfig.colorSchemeControl = false;
    const navbar = renderShell();
    expect(
      within(navbar).queryByRole('button', { name: 'Toggle color scheme' })
    ).not.toBeInTheDocument();
  });
});
