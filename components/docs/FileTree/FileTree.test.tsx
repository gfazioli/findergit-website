import { renderToString } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { FileTree } from './FileTree';

describe('FileTree', () => {
  it('serves the names inside a closed folder', () => {
    const html = renderToString(
      <MantineProvider>
        <FileTree>
          <FileTree.Folder name="closed-folder">
            <FileTree.File name="hidden-file.ts" />
          </FileTree.Folder>
        </FileTree>
      </MantineProvider>
    );

    expect(html).toContain('closed-folder');
    expect(html).toContain('hidden-file.ts');
  });
});
