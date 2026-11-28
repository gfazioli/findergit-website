import { copyableCode } from './copyable-code';

describe('copyableCode', () => {
  const coloured = '\u001b[1;32mOK\u001b[0m done \u001b[38;5;208mwarn\u001b[m';

  it('strips SGR escape codes from an ansi block', () => {
    expect(copyableCode(coloured, 'ansi')).toBe('OK done warn');
  });

  it('strips colon-separated parameters, and takes the language in any case', () => {
    expect(copyableCode('\u001b[38:2::255:0:0mred\u001b[0m', 'ansi')).toBe('red');
    expect(copyableCode(coloured, 'ANSI')).toBe('OK done warn');
  });

  it('leaves every other language as written', () => {
    expect(copyableCode(coloured, 'bash')).toBe(coloured);
    expect(copyableCode(coloured, undefined)).toBe(coloured);
  });
});
