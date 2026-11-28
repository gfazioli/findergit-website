import { parsePageSource, titleFromName } from './page-source';

describe('parsePageSource', () => {
  it('reads title and sidebarTitle from the front matter, quoted or not', () => {
    const source = `---\ntitle: "Getting started"\nsidebarTitle: Start\ndescription: x\n---\n\n# Ignored for the title\n`;
    expect(parsePageSource(source)).toEqual({
      title: 'Getting started',
      sidebarTitle: 'Start',
      heading: 'Ignored for the title',
    });
  });

  it('takes the first level-one heading, skipping code fences and stripping inline marks', () => {
    const source = [
      'import { Callout } from "@/components/docs";',
      '',
      '```md',
      '# Not this one, it is code',
      '```',
      '',
      '## A second-level heading',
      '',
      '# The `real` **title**',
      '',
      '# A later one',
    ].join('\n');
    expect(parsePageSource(source).heading).toBe('The real title');
  });

  it('returns nothing for a page with neither front matter nor heading', () => {
    expect(parsePageSource('Just text.\n')).toEqual({});
  });
});

describe('titleFromName', () => {
  it('turns a file name into words', () => {
    expect(titleFromName('inline-svg')).toBe('Inline Svg');
    expect(titleFromName('release_notes')).toBe('Release Notes');
  });
});
