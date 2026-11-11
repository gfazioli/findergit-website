import { redactUrl } from './SiteAnalytics';

// The package ships ESM that Jest does not transform; the redaction is what is under test.
jest.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));

describe('redactUrl', () => {
  it('drops the buyer key from the Goodies thank-you page', () => {
    expect(redactUrl('https://findergit.app/goodies/thanks?session_id=cs_live_a1B2#top')).toBe(
      'https://findergit.app/goodies/thanks'
    );
  });

  it('leaves every other page as it was, query included', () => {
    for (const url of [
      'https://findergit.app/goodies',
      'https://findergit.app/goodies/thanksgiving?x=1',
      'https://findergit.app/docs/faq?utm_source=x',
      'not a url',
    ]) {
      expect(redactUrl(url)).toBe(url);
    }
  });
});
