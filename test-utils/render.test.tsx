import { useEffect } from 'react';
import { render } from './render';

let mounts = 0;

function Counted({ label }: { label: string }) {
  useEffect(() => {
    mounts += 1;
  }, []);
  return <span>{label}</span>;
}

describe('render', () => {
  beforeEach(() => {
    mounts = 0;
  });

  it('updates in place on rerender, never remounts', () => {
    const { rerender, getByText } = render(<Counted label="one" />);
    rerender(<Counted label="two" />);
    rerender(<Counted label="three" />);
    expect(getByText('three')).toBeInTheDocument();
    expect(mounts).toBe(1);
  });
});
