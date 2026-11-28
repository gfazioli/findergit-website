import { FileTreeFile, FileTreeFolder, FileTreeRoot } from './FileTreeParts';

/**
 * A file tree, with Nextra's compound API:
 *
 * ```mdx
 * <FileTree>
 *   <FileTree.Folder name="app" defaultOpen>
 *     <FileTree.File name="layout.tsx" />
 *   </FileTree.Folder>
 * </FileTree>
 * ```
 *
 * The compound object is assembled in this server module: statics cannot be attached to a client
 * reference across the RSC boundary.
 */
function FileTreeBase(props: { children: React.ReactNode }) {
  return <FileTreeRoot {...props} />;
}

export const FileTree = Object.assign(FileTreeBase, {
  Folder: FileTreeFolder,
  File: FileTreeFile,
});
