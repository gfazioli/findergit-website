import { fireEvent, render, screen, within } from '@/test-utils';
import { ImageZoom } from './ImageZoom';

const shot = { src: '/_next/static/media/shot.png', width: 2000, height: 1000 };

describe('ImageZoom', () => {
  it('draws the zoomed copy at the file width, within 90% of the viewport', () => {
    render(<ImageZoom src={shot} alt="A screenshot" />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge: A screenshot' }));
    const zoomed = within(screen.getByRole('dialog')).getByAltText('A screenshot');
    expect(zoomed.getAttribute('sizes')).toBe('min(90vw, 2000px, calc(90vh * 2))');
    // jsdom folds the calc: the same width.
    expect(zoomed.style.width).toBe('min(90vw, 2000px, 180vh)');
  });

  it('leaves a picture of unknown size to the viewport (`fill` takes no width)', () => {
    render(<ImageZoom src="https://example.com/a.png" alt="Remote" fill />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge: Remote' }));
    const zoomed = within(screen.getByRole('dialog')).getByAltText('Remote');
    expect(zoomed.getAttribute('sizes')).toBe('100vw');
    expect(zoomed.style.width).toBe('100%');
  });

  it('keeps a static import that fills its box to the viewport', () => {
    render(<ImageZoom src={shot} alt="Filled" fill />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge: Filled' }));
    const zoomed = within(screen.getByRole('dialog')).getByAltText('Filled');
    expect(zoomed.getAttribute('sizes')).toBe('100vw');
  });
});
