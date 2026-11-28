import type { CSSProperties } from 'react';
import { render } from '@/test-utils';
import { DocsImage, docsSizes } from './DocsImage';

// What is under test is what DocsImage hands to the engine's ImageZoom, so a
// stand-in records exactly that.
jest.mock('@/components/docs', () => ({
  ImageZoom: (props: {
    alt?: string;
    sizes?: string;
    placeholder?: string;
    style?: CSSProperties;
  }) => (
    <img
      alt={props.alt}
      data-sizes={props.sizes}
      data-placeholder={props.placeholder}
      style={props.style}
    />
  ),
}));

// Static imports, the shape the engine's remark-static-images makes of a
// Markdown image in `public/`:
// the sidebar crop and a window shot, at their sizes on disk.
const crop = {
  src: '/_next/static/media/screenshot-sidebar.1z71mrr.png',
  width: 278,
  height: 1185,
};
const shot = {
  src: '/_next/static/media/screenshot-detail-overview.0q8a3kd.png',
  width: 2000,
  height: 1282,
};

/** What a picture of unknown width asks for: the whole column. */
const COLUMN = docsSizes();

function drawn(props: Parameters<typeof DocsImage>[0]) {
  const { container } = render(<DocsImage {...props} />);
  return container.querySelector('img')!;
}

describe('DocsImage', () => {
  it('asks for a picture narrower than the column at its own width', () => {
    const img = drawn({ src: crop, alt: 'The sidebar' });
    expect(img.dataset.sizes).toBe(docsSizes(278));
  });

  it('asks for a window shot at the smaller of the column and its width', () => {
    const img = drawn({ src: shot, alt: 'The detail panel' });
    expect(img.dataset.sizes).toBe(docsSizes(2000));
  });

  it('reads a picture imported as a module the same way', () => {
    const img = drawn({ src: { default: crop }, alt: 'The sidebar' });
    expect(img.dataset.sizes).toBe(docsSizes(278));
  });

  it('asks for the column when it cannot know the size', () => {
    const img = drawn({ src: 'https://example.com/screenshot-x.png', alt: '' });
    expect(img.dataset.sizes).toBe(COLUMN);
  });

  // Nextra set `placeholder="blur"` on every static image: the preview is the
  // first thing painted where the picture goes.
  it('paints the blurred preview an import carries, and asks for none without one', () => {
    const blurred = { ...shot, blurDataURL: 'data:image/png;base64,AAAA' };
    expect(drawn({ src: blurred, alt: '' }).dataset.placeholder).toBe('blur');
    expect(drawn({ src: { default: blurred }, alt: '' }).dataset.placeholder).toBe('blur');
    expect(drawn({ src: shot, alt: '' }).dataset.placeholder).toBeUndefined();
    expect(
      drawn({ src: 'https://example.com/x.png', alt: '', width: 10, height: 10 }).dataset
        .placeholder
    ).toBeUndefined();
  });

  // One capture here is two pixels per point, and nothing marks it (see
  // `drawnWidth`), so nothing is drawn smaller: the width stays the browser's.
  it('leaves the drawn size alone', () => {
    expect(drawn({ src: crop, alt: '' }).style.maxWidth).toBe('');
    expect(drawn({ src: shot, alt: '' }).style.maxWidth).toBe('');
  });
});

// The column: in rem and em, as the engine lays it out, so that it moves with
// the visitor's default font.
describe('docsSizes', () => {
  it('follows the column for a picture of unknown width', () => {
    expect(docsSizes()).toBe(
      '(width < 55.75em) calc(100vw - 2rem), (width < 62em) 53.75rem, (width < 75em) calc(100vw - 21.5rem), (width < 91.25em) calc(100vw - 38.5rem), 52.75rem'
    );
  });

  it('asks for the smaller of the column and the picture, in each stretch', () => {
    expect(docsSizes(380)).toBe(
      '(width < 55.75em) min(calc(100vw - 2rem), 380px), (width < 62em) min(53.75rem, 380px), (width < 75em) min(calc(100vw - 21.5rem), 380px), (width < 91.25em) min(calc(100vw - 38.5rem), 380px), min(52.75rem, 380px)'
    );
  });
});
