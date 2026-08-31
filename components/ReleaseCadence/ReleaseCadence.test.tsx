import { render, screen } from '@/test-utils';
import { ReleaseCadence } from './ReleaseCadence';

const FRESH = {
  freshness: 'Updated today',
  latestDate: 'August 31, 2026',
  total: 47,
  since: 'April 2026',
} as const;

describe('ReleaseCadence', () => {
  it('leads with the freshness phrase and backs it with the count', () => {
    render(<ReleaseCadence cadence={FRESH} />);
    expect(screen.getByText('Updated today')).toBeInTheDocument();
    expect(screen.getByText(/47 releases since April 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /what's new/i })).toHaveAttribute(
      'href',
      '/docs/release-notes'
    );
  });

  it('states the plain date once the release is too old to sell as fresh', () => {
    render(<ReleaseCadence cadence={{ ...FRESH, freshness: null }} />);
    expect(screen.getByText('Latest release August 31, 2026')).toBeInTheDocument();
  });

  it('drops the count line rather than printing a number it does not have', () => {
    // The degraded path: the releases API failed and the strip is running off
    // the config date alone. Printing "0 releases" here would say the app has
    // never shipped.
    render(<ReleaseCadence cadence={{ ...FRESH, total: null, since: null }} />);
    expect(screen.queryByText(/releases since/)).not.toBeInTheDocument();
    expect(screen.getByText('Updated today')).toBeInTheDocument();
  });
});
