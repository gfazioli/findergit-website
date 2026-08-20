import { formatReleaseDate } from './format-release-date';

// The suite runs in Pacific/Auckland (pinned in jest.global-setup.cjs, since a
// beforeAll is too late to affect Intl). That zone is ahead of UTC, so the first
// case below renders "August 20, 2026" without the UTC pin and this file goes
// red. Under UTC — or under Europe/Rome, which agrees with UTC for these
// timestamps — it would pass either way and prove nothing.
describe('formatReleaseDate', () => {
  it('keeps an afternoon-UTC publication on its own calendar date', () => {
    // v0.26.0, published 16:40 UTC, which is already 20 August in Auckland.
    expect(formatReleaseDate('2026-08-19T16:40:46Z', '2026-08-19T15:56:50Z')).toBe(
      'August 19, 2026'
    );
  });

  it('dates a release by publication, not by the commit its tag points at', () => {
    // v0.25.0: tagged on a commit from 1 August, actually shipped on the 6th.
    expect(formatReleaseDate('2026-08-06T09:08:57Z', '2026-08-01T17:24:23Z')).toBe(
      'August 6, 2026'
    );
  });

  it('falls back to the created date for a draft, which has no publication date', () => {
    expect(formatReleaseDate(null, '2026-08-06T09:08:57Z')).toBe('August 6, 2026');
  });
});
