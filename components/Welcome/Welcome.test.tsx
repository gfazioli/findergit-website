import { render, screen } from '@/test-utils';
import { Welcome } from './Welcome';

describe('Welcome component', () => {
  it('renders the hero title', () => {
    render(<Welcome />);
    // Only the plain-text half of the headline is asserted: the rest ("Always live.") is rendered
    // by TextAnimate, which splits it per character, so it is not a single text node.
    expect(screen.getByText(/every git repo\. one window\./i)).toBeInTheDocument();
  });
});
