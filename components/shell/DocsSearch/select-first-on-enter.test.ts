import { selectFirstOnEnter } from './select-first-on-enter';

/** A Spotlight-like dialog: the search input and the actions Pagefind's results became. */
function dialog(selected?: number) {
  document.body.innerHTML = `
    <div role="dialog">
      <input />
      <button data-action>First</button>
      <button data-action>Second</button>
    </div>`;
  const actions = document.querySelectorAll('[data-action]');
  if (selected !== undefined) {
    actions[selected].setAttribute('data-selected', 'true');
  }
  return { input: document.querySelector('input')!, actions };
}

function press(input: HTMLInputElement, code: string, isComposing = false) {
  selectFirstOnEnter({
    nativeEvent: { code, isComposing },
    currentTarget: input,
  } as unknown as React.KeyboardEvent<HTMLInputElement>);
}

describe('selectFirstOnEnter', () => {
  it('marks the first action when Enter finds nothing selected', () => {
    const { input, actions } = dialog();
    press(input, 'Enter');
    expect(actions[0].hasAttribute('data-selected')).toBe(true);
    expect(actions[1].hasAttribute('data-selected')).toBe(false);
  });

  it('keeps the action the reader chose with the arrows', () => {
    const { input, actions } = dialog(1);
    press(input, 'NumpadEnter');
    expect(actions[0].hasAttribute('data-selected')).toBe(false);
    expect(actions[1].hasAttribute('data-selected')).toBe(true);
  });

  it('leaves the Enter that commits a composition alone', () => {
    const { input, actions } = dialog();
    press(input, 'Enter', true);
    expect(actions[0].hasAttribute('data-selected')).toBe(false);
  });

  it('ignores every other key', () => {
    const { input, actions } = dialog();
    press(input, 'KeyA');
    expect(actions[0].hasAttribute('data-selected')).toBe(false);
  });
});
