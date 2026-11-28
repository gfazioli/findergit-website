/**
 * Enter with no result selected opens the first one.
 *
 * Mantine's Spotlight selects the first action when the query changes, but Pagefind's results
 * arrive later (the debounce, then the search), so nothing was selected when they showed and
 * Enter did nothing until an arrow key. Given as the search input's `onKeyDown`, this runs just
 * before Spotlight's own Enter handler, which clicks the action marked `data-selected`: marking
 * the first action is all it takes. An action the reader already chose with the arrows is kept.
 */
export function selectFirstOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.nativeEvent.code !== 'Enter' && event.nativeEvent.code !== 'NumpadEnter') {
    return;
  }
  // The Enter that commits an input method's composition (Chinese, Japanese, Korean) is not a
  // search: Spotlight ignores it too.
  if (event.nativeEvent.isComposing) {
    return;
  }
  const scope = event.currentTarget.closest('[role="dialog"]') ?? document;
  if (!scope.querySelector('[data-action][data-selected]')) {
    scope.querySelector('[data-action]')?.setAttribute('data-selected', 'true');
  }
}
