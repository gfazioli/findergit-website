import { fireEvent, render, screen } from '@/test-utils';
import { ImageZoom } from './ImageZoom';

const shot = { src: '/_next/static/media/shot.png', width: 2000, height: 1000 };

describe('ImageZoom', () => {
  it('draws the zoomed copy at the file width, within 90% of the viewport', () => {
    render(<ImageZoom src={shot} alt="A screenshot" />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge: A screenshot' }));
    const zoomed = screen.getAllByAltText('A screenshot').at(-1)!;
    expect(zoomed.getAttribute('sizes')).toBe('min(90vw, 2000px, calc(90vh * 2))');
    // jsdom folds the calc: the same width.
    expect(zoomed.style.width).toBe('min(90vw, 2000px, 180vh)');
  });

  it('leaves a picture of unknown size to the viewport (`fill` takes no width)', () => {
    render(<ImageZoom src="https://example.com/a.png" alt="Remote" fill />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge: Remote' }));
    const zoomed = screen.getAllByAltText('Remote').at(-1)!;
    expect(zoomed.getAttribute('sizes')).toBe('100vw');
    expect(zoomed.style.width).toBe('100%');
  });
});
