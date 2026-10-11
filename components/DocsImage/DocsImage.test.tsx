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

const COLUMN =
  '(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) calc(100vw - 352px), (max-width: 1439px) calc(100vw - 608px), 832px';

function drawn(props: Parameters<typeof DocsImage>[0]) {
  const { container } = render(<DocsImage {...props} />);
  return container.querySelector('img')!;
}

describe('DocsImage', () => {
  it('asks for a picture narrower than the column at its own width', () => {
    const img = drawn({ src: crop, alt: 'The sidebar' });
    expect(img.dataset.sizes).toBe('(max-width: 310px) calc(100vw - 32px), 278px');
  });

  it('asks for the column for a window shot wider than it', () => {
    const img = drawn({ src: shot, alt: 'The detail panel' });
    expect(img.dataset.sizes).toBe(COLUMN);
  });

  it('reads a picture imported as a module the same way', () => {
    const img = drawn({ src: { default: crop }, alt: 'The sidebar' });
    expect(img.dataset.sizes).toBe('(max-width: 310px) calc(100vw - 32px), 278px');
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

// The column, measured: the viewport less 32px under 768, less 352px under
// 1280, less 608px above, and never wider than 832px.
describe('docsSizes', () => {
  it('follows the column for a picture as wide as it, or wider', () => {
    expect(docsSizes()).toBe(COLUMN);
    expect(docsSizes(1200)).toBe(docsSizes());
  });

  it('gives a picture narrower than the column its own width', () => {
    expect(docsSizes(380)).toBe('(max-width: 412px) calc(100vw - 32px), 380px');
    expect(docsSizes(600)).toBe(
      '(max-width: 632px) calc(100vw - 32px), (max-width: 767px) 600px, (max-width: 952px) calc(100vw - 352px), 600px'
    );
  });

  it('switches from the column to the picture where they cross on a laptop', () => {
    expect(docsSizes(760)).toBe(
      '(max-width: 767px) calc(100vw - 32px), (max-width: 1112px) calc(100vw - 352px), (max-width: 1279px) 760px, (max-width: 1368px) calc(100vw - 608px), 760px'
    );
  });
});
