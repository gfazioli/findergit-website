import { render, screen } from '@/test-utils';
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
