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
