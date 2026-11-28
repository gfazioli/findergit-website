import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { panelIndexOf, targetFromHash } from '@/lib/docs/tab-hash';
import { Tabs } from './Tabs';

function renderTabs() {
  return render(
    <MantineProvider>
      <Tabs items={['npm', 'yarn']}>
        <Tabs.Tab>
          <h3 id="first">First heading</h3>
        </Tabs.Tab>
        <Tabs.Tab>
          <h3 id="sql-export">SQL export</h3>
        </Tabs.Tab>
      </Tabs>
    </MantineProvider>
  );
}

const selected = () => screen.getByRole('tab', { selected: true }).textContent;

describe('Tabs and location.hash', () => {
  afterEach(() => {
    window.location.hash = '';
    // A failed expectation must not leave a spy on scrollIntoView for the next test.
    jest.restoreAllMocks();
  });

  it('opens the panel holding the hash target on mount, and scrolls to it once it shows', () => {
    const shown: boolean[] = [];
    const scroll = jest
      .spyOn(window.HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(function (this: HTMLElement) {
        // Mantine hides a closed panel with display: none on the panel element.
        const panel = this.closest('[data-docs-tab-panel]') as HTMLElement | null;
        shown.push(panel !== null && panel.style.display !== 'none');
      });
    window.location.hash = '#sql-export';
    renderTabs();
    expect(selected()).toBe('yarn');
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(shown).toEqual([true]);
    scroll.mockRestore();
  });

  it('keeps the first tab when the hash points into it, or nowhere', () => {
    window.location.hash = '#first';
    const { unmount } = renderTabs();
    expect(selected()).toBe('npm');
    unmount();
    window.location.hash = '#nothing-here';
    renderTabs();
    expect(selected()).toBe('npm');
  });

  it('opens the panel on hashchange and scrolls the target into view', () => {
    const scroll = jest.spyOn(window.HTMLElement.prototype, 'scrollIntoView');
    renderTabs();
    expect(selected()).toBe('npm');
    act(() => {
      window.location.hash = '#sql-export';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(selected()).toBe('yarn');
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('sql-export'));
    scroll.mockRestore();
  });

  it('opens the panel when a link to the anchor is clicked, even for the same hash', async () => {
    renderTabs();
    const link = document.createElement('a');
    link.setAttribute('href', '#sql-export');
    document.body.appendChild(link);
    act(() => link.click());
    expect(selected()).toBe('yarn');
    act(() => screen.getByRole('tab', { name: 'npm' }).click());
    expect(selected()).toBe('npm');
    act(() => link.click());
    expect(selected()).toBe('yarn');
    link.remove();
  });
});

describe('tab-hash helpers', () => {
  it('decodes a percent-encoded id and tolerates a malformed one', () => {
    document.body.innerHTML = '<h3 id="café"></h3><h3 id="100%"></h3>';
    expect(targetFromHash('#caf%C3%A9')?.id).toBe('café');
    expect(targetFromHash('#100%')?.id).toBe('100%');
    expect(targetFromHash('')).toBeNull();
    expect(panelIndexOf([], null)).toBe(-1);
  });
});
