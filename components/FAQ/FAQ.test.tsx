import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@/test-utils';
import { theme } from '@/theme';
import { FAQ_ENTRIES } from '@/components/StructuredData/StructuredData';
import { FAQ, faqItems } from './FAQ';

/**
 * The FAQ JSON-LD in StructuredData.tsx is a plain-text mirror of the visible
 * accordion, and Google requires the two to match. Nothing enforced that, and
 * they had drifted: two answers on the page said "email us" while the mirror
 * still said "open an issue on GitHub". This pins the question lists to each
 * other, in order, so a new or reworded entry has to land in both.
 */
describe('FAQ and its JSON-LD mirror', () => {
  it('ask the same questions in the same order', () => {
    expect(FAQ_ENTRIES.map((e) => e.question)).toEqual(faqItems.map((i) => i.question));
  });

  it('render every question', () => {
    render(<FAQ />);
    for (const { question } of faqItems) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it('answer the Kaleidoscope question', () => {
    const entry = FAQ_ENTRIES.find((e) => /kaleidoscope/i.test(e.question));
    expect(entry?.answer).toMatch(/button appears beside Refresh Diff/);
  });
});

/**
 * The defect lived on the SERVER, so this renders there. Mantine 9 keeps a
 * closed panel in a React <Activity>, which the server renders as nothing: the
 * page Google fetched carried every question and no answer. A jsdom `render`
 * cannot see it -- on the client a hidden Activity still mounts its children.
 * No `env="test"` either, because that switches Mantine's Collapse to a
 * different branch than the one the site runs.
 */
describe('FAQ server render', () => {
  it('carries every answer in the HTML, not only the questions', () => {
    const html = renderToString(
      <MantineProvider theme={theme}>
        <FAQ />
      </MantineProvider>
    );
    const plain = faqItems.filter((i) => typeof i.answer === 'string');
    expect(plain.length).toBeGreaterThan(5);
    for (const { answer } of plain) {
      // The opening words: no quote or ampersand, which renderToString escapes.
      const opening = (answer as string).split(/['"&]/)[0].slice(0, 40);
      expect(html).toContain(opening);
    }
  });
});
