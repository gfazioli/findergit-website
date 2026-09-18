import { render, screen } from '@/test-utils';
import { DiffViewerSection, diffLines, diffStats } from './DiffViewerSection';

describe('DiffViewerSection', () => {
  // The header used to say "+12 −4" over a body with eight additions and two
  // deletions. The counts are now derived from the lines; this pins that the
  // derivation agrees with the lines AND that the header prints it.
  it('shows header stats that agree with the lines it draws', () => {
    const additions = diffLines.filter((l) => l.type === 'addition').length;
    const deletions = diffLines.filter((l) => l.type === 'deletion').length;
    expect(diffStats).toEqual({ additions, deletions });

    render(<DiffViewerSection />);
    expect(screen.getByText(`+${additions}`)).toBeInTheDocument();
    expect(screen.getByText(`-${deletions}`)).toBeInTheDocument();
  });

  it('hands the diff to Kaleidoscope and links the docs anchor', () => {
    render(<DiffViewerSection />);
    expect(screen.getAllByText(/open in kaleidoscope/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /kaleidoscope/i })).toHaveAttribute(
      'href',
      '/docs/diff-viewer#open-in-kaleidoscope'
    );
  });

  it('names the trademark holder', () => {
    render(<DiffViewerSection />);
    expect(screen.getByText(/registered trademark of Leitmotif GmbH/i)).toBeInTheDocument();
  });
});
