import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('serves the text of every panel, not only the open one', () => {
    const html = renderToString(
      <MantineProvider>
        <Tabs items={['npm', 'yarn']}>
          <Tabs.Tab>npm install first</Tabs.Tab>
          <Tabs.Tab>yarn add second</Tabs.Tab>
        </Tabs>
      </MantineProvider>
    );

    expect(html).toContain('npm install first');
    expect(html).toContain('yarn add second');
  });
});
