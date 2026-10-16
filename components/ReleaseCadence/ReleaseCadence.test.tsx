import { render, screen } from '@/test-utils';
import { ReleaseCadence } from './ReleaseCadence';

const FRESH = {
  freshness: 'Updated today',
  latestDate: 'August 31, 2026',
  total: 47,
  since: 'April 2026',
  downloads: '2,531',
} as const;

describe('ReleaseCadence', () => {
  it('leads with the freshness phrase and backs it with the count', () => {
    render(<ReleaseCadence cadence={FRESH} />);
    expect(screen.getByText('Updated today')).toBeInTheDocument();
    // The count rolls up (ScrollNumber), so it sits in a span of its own: match
    // the line by its whole text, which is still exactly this sentence.
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && el.textContent === '47 releases since April 2026'
      )
    ).toBeInTheDocument();
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
    render(<ReleaseCadence cadence={{ ...FRESH, total: null, since: null, downloads: null }} />);
    expect(screen.queryByText(/releases since/)).not.toBeInTheDocument();
    expect(screen.queryByText(/downloads/)).not.toBeInTheDocument();
    expect(screen.getByText('Updated today')).toBeInTheDocument();
  });

  it('states the downloads beside the release count', () => {
    render(<ReleaseCadence cadence={FRESH} />);
    // The figure rolls up like the count, so match the whole line's text.
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '2,531 downloads')
    ).toBeInTheDocument();
  });

  it('puts a separator between two facts and never one with nothing after it', () => {
    const { unmount } = render(<ReleaseCadence cadence={FRESH} />);
    expect(screen.getAllByText('·')).toHaveLength(2);
    unmount();

    render(<ReleaseCadence cadence={{ ...FRESH, downloads: null }} />);
    expect(screen.getAllByText('·')).toHaveLength(1);
    expect(screen.getByText(/releases since/)).toBeInTheDocument();
  });

  it('gives the phone rules their hooks with or without the downloads', () => {
    // On a phone every strip stacks, the count-only one too (it hung a dot at
    // 320px): `facts` is the row the rules turn into a column and `separator`
    // what they hide, so both must be there in either state.
    const row = () => screen.getByRole('link', { name: /what's new/i }).parentElement;
    const { unmount } = render(<ReleaseCadence cadence={FRESH} />);
    expect(row()).toHaveClass('facts');
    screen.getAllByText('·').forEach((dot) => expect(dot).toHaveClass('separator'));
    unmount();

    render(<ReleaseCadence cadence={{ ...FRESH, downloads: null }} />);
    expect(row()).toHaveClass('facts');
    screen.getAllByText('·').forEach((dot) => expect(dot).toHaveClass('separator'));
  });
});
