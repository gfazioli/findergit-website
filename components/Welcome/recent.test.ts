import { isRecent } from './recent';

describe('isRecent', () => {
  it('is recent in the release that introduced it', () => {
    expect(isRecent('0.38.0', '0.38.0')).toBe(true);
  });

  it('stays recent for the default window of two minor releases', () => {
    expect(isRecent('0.38.0', '0.39.2')).toBe(true);
    expect(isRecent('0.38.0', '0.40.0')).toBe(true);
  });

  it('expires on the third minor release after it', () => {
    expect(isRecent('0.38.0', '0.41.0')).toBe(false);
  });

  it('honours a custom window', () => {
    expect(isRecent('0.38.0', '0.39.0', 0)).toBe(false);
    expect(isRecent('0.38.0', '0.43.0', 5)).toBe(true);
  });

  it('is never recent across a major', () => {
    expect(isRecent('0.38.0', '1.0.0')).toBe(false);
  });

  it('does not decorate a feature the shipped version does not have yet', () => {
    expect(isRecent('0.40.0', '0.38.0')).toBe(false);
  });

  it('refuses malformed versions instead of guessing', () => {
    expect(isRecent('next', '0.38.0')).toBe(false);
    expect(isRecent('0.38.0', '')).toBe(false);
  });

  // The four cards that were still "New" 25 releases later, with the versions
  // that introduced them: this is the case the helper exists for.
  it('takes the sticker off the June and July features at 0.38.0', () => {
    expect(isRecent('0.13.0', '0.38.0')).toBe(false); // Overview, Account, star alerts
    expect(isRecent('0.18.0', '0.38.0')).toBe(false); // localization
  });
});
