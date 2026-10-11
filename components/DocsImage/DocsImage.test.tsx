import type { CSSProperties } from 'react';
import { render } from '@/test-utils';
import { DocsImage, docsSizes } from './DocsImage';

// Nextra ships ESM that Jest does not transform. What is under test is what
// DocsImage hands to ImageZoom, so a stand-in records exactly that.
jest.mock(
  'nextra/components',
  () => ({
    ImageZoom: (props: { alt?: string; sizes?: string; style?: CSSProperties }) => (
      <img alt={props.alt} data-sizes={props.sizes} style={props.style} />
    ),
  }),
  { virtual: true }
);

// Static imports, the shape Nextra makes of a Markdown image in `public/`:
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

  // One capture here is two pixels per point, and nothing marks it (see
  // `drawnWidth`), so nothing is drawn smaller: the width stays the browser's.
  it('leaves the drawn size alone', () => {
    expect(drawn({ src: crop, alt: '' }).style.maxWidth).toBe('');
    expect(drawn({ src: shot, alt: '' }).style.maxWidth).toBe('');
  });
});

// The column, measured: in rem and em, as Nextra lays it out, so that it
// moves with the visitor's default font.
describe('docsSizes', () => {
  it('follows the column for a picture of unknown width', () => {
    expect(docsSizes()).toBe(
      '(max-width: 47.99875em) calc(100vw - 2rem), (max-width: 79.99875em) calc(100vw - 22rem), (max-width: 89.99875em) calc(100vw - 38rem), 52rem'
    );
  });

  it('asks for the smaller of the column and the picture, in each stretch', () => {
    expect(docsSizes(380)).toBe(
      '(max-width: 47.99875em) min(calc(100vw - 2rem), 380px), (max-width: 79.99875em) min(calc(100vw - 22rem), 380px), (max-width: 89.99875em) min(calc(100vw - 38rem), 380px), min(52rem, 380px)'
    );
  });
});
