import { blurPlaceholder } from './blur-placeholder';

const shot = { src: '/_next/static/media/shot.png', width: 2000, height: 1282 };

describe('blurPlaceholder', () => {
  it('asks for the blurred preview an import carries', () => {
    const blurred = { ...shot, blurDataURL: 'data:image/png;base64,AAAA' };
    expect(blurPlaceholder(blurred)).toBe('blur');
    expect(blurPlaceholder({ default: blurred })).toBe('blur');
  });

  it('asks for none when there is no preview: an SVG or GIF import, or a URL', () => {
    expect(blurPlaceholder(shot)).toBeUndefined();
    expect(blurPlaceholder('/photo.png')).toBeUndefined();
  });
});
