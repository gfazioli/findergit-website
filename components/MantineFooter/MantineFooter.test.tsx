import { render, screen, within } from '@/test-utils';
import config from '@/config';
import { MantineFooter } from './MantineFooter';

/**
 * The publisher line is a legal requirement, not decoration: the VAT number on
 * every page (art. 35 DPR 633/72) and the legal notice reachable from every
 * page (art. 7 D.Lgs. 70/2003). It is read from `config.legal`, so this pins
 * the text the reader actually gets, whitespace included -- a space lost
 * between JSX chunks would join the owner to the VAT number.
 */
describe('MantineFooter publisher line', () => {
  it('names the brand, the owner and the VAT number', () => {
    render(<MantineFooter year={2026} />);
    const line = screen.getByText(/P\.IVA/).closest('p');
    expect(line?.textContent).toBe(
      `© 2026 ${config.legal.brand} — ${config.legal.owner}·P.IVA ${config.legal.vatNumber}·Legal·Privacy`
    );
  });

  it('links to the legal notice and the privacy policy', () => {
    render(<MantineFooter year={2026} />);
    // Scoped to the line: a footer column may carry a Privacy link of its own.
    const line = screen.getByText(/P\.IVA/).closest('p') as HTMLElement;
    expect(within(line).getByRole('link', { name: 'Legal' })).toHaveAttribute(
      'href',
      '/docs/legal'
    );
    expect(within(line).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/docs/privacy'
    );
  });
});

/**
 * The footer's "Listed on" row carries every directory badge but Product
 * Hunt's (that one is under the hero). A directory verifies its badge on the
 * home page, which this footer closes.
 */
describe('MantineFooter directory badges', () => {
  it('links every footer directory under the Support card', () => {
    render(<MantineFooter year={2026} />);
    const footerBadges = config.directoryBadges.filter((badge) => badge.placement === 'footer');
    expect(footerBadges.length).toBeGreaterThan(0);
    for (const badge of footerBadges) {
      expect(screen.getByRole('img', { name: badge.alt }).closest('a')).toHaveAttribute(
        'href',
        badge.href
      );
    }
    expect(screen.getByText('Listed on')).toBeInTheDocument();
  });
});
