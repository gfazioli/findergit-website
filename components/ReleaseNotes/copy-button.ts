/**
 * The copy button `compileMarkdown` puts after each code block of a release
 * body, and what clicking it does. A module of its own, with no dependency, so
 * the client component can import it without bringing the Markdown compiler.
 */
export const COPY_BUTTON_ATTRIBUTE = 'data-release-copy';

const COPIED_FOR_MS = 1500;

/**
 * One listener for every button of the timeline: copies the text of the code
 * block before the clicked button, and says so on the button for a moment.
 */
export function copyFromButton(target: EventTarget | null) {
  const button = (target as Element | null)?.closest?.(`[${COPY_BUTTON_ATTRIBUTE}]`);
  const code = button?.parentElement?.querySelector('pre')?.textContent;
  if (!button || code === undefined || !navigator.clipboard) {
    return;
  }
  // Without the block's last newline: pasted into Terminal, it would run the command.
  navigator.clipboard.writeText(code.replace(/\n$/, '')).then(
    () => {
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, COPIED_FOR_MS);
    },
    () => {}
  );
}
