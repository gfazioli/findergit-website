import GithubSlugger from 'github-slugger';

/**
 * Gives every heading its `id` from the text as written, before `remark-smartypants` turns `--`
 * into an em dash and straight quotes into curly ones. `rehype-slug` (which runs after, on the
 * smartened text) leaves an element that already has an id alone, so a heading such as
 * `## ASSEMBLY.H -- Main Include File` keeps the anchor `assemblyh----main-include-file` that
 * deep links already use, while its visible text still gets the typographic dash.
 *
 * Same slugger and the same document order as `rehype-slug`, so repeated headings get the same
 * `-1`, `-2` suffixes. It runs per page.
 */
function textOf(node) {
  if (typeof node.value === 'string' && node.type !== 'html') {
    return node.value;
  }
  return Array.isArray(node.children) ? node.children.map(textOf).join('') : '';
}

export default function remarkHeadingIds() {
  return (tree) => {
    const slugger = new GithubSlugger();
    const walk = (node) => {
      if (node.type === 'heading') {
        node.data = {
          ...node.data,
          hProperties: { ...node.data?.hProperties, id: slugger.slug(textOf(node)) },
        };
        return;
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    };
    walk(tree);
  };
}
