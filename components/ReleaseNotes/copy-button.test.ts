import { copyFromButton } from './copy-button';

function block(code: string) {
  document.body.innerHTML = `<div class="release-code"><pre><code>${code}</code></pre><button type="button" data-release-copy>Copy</button></div><p id="other">text</p>`;
  return document.querySelector('button')!;
}

describe('copyFromButton', () => {
  const writeText = jest.fn(() => Promise.resolve());
  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });
  beforeEach(() => writeText.mockClear());

  it('copies the block without its last newline, and says so', async () => {
    const button = block('shasum -a 256 FinderGit.dmg\n');
    copyFromButton(button);
    expect(writeText).toHaveBeenCalledWith('shasum -a 256 FinderGit.dmg');
    await Promise.resolve();
    expect(button.textContent).toBe('Copied');
  });

  it('ignores a click anywhere else on the timeline', () => {
    block('x');
    copyFromButton(document.getElementById('other'));
    copyFromButton(null);
    expect(writeText).not.toHaveBeenCalled();
  });
});
