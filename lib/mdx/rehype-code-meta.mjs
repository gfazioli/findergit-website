/**
 * Keeps the meta string of a fenced code block on its `<pre>`.
 *
 * In ```` ```ts filename="config/index.ts" copy {4} ```` the part after the language is the
 * meta. MDX parks it on the `<code>` element's `data`, which never reaches a component, so the
 * code block would lose its file name and its highlighted lines. This plugin copies it to the
 * `<pre>` as `data-meta`, together with the language as `data-language`.
 *
 * It is a plain module, with no dependency, because Turbopack loads rehype plugins by path.
 */
export default function rehypeCodeMeta() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (node.type === 'element' && node.tagName === 'pre') {
    const code = node.children?.find(
      (child) => child.type === 'element' && child.tagName === 'code'
    );
    if (code) {
      const meta = code.data?.meta;
      if (meta) {
        node.properties = { ...node.properties, dataMeta: meta };
      }
      const className = code.properties?.className;
      const languageClass = Array.isArray(className)
        ? className.find((name) => String(name).startsWith('language-'))
        : undefined;
      if (languageClass) {
        node.properties = {
          ...node.properties,
          dataLanguage: String(languageClass).slice('language-'.length),
        };
      }
    }
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(walk);
  }
}
