/**
 * The first picture of a docs page is fetched at once: `loading="eager"` and
 * `fetchPriority="high"` on the first Markdown image, every other one left lazy.
 *
 * A docs page that opens with a screenshot has it near the top, in the first
 * screen of a phone, and it is the page's LCP. Lazy, its request waited for
 * the browser to lay the page out and decide it was on screen: 1.6 s after the
 * first paint on a throttled phone (Lighthouse on findergit.app's /docs, moved
 * over from Nextra: the request at 3.5 s, the picture at 4.2 s). Eager, React
 * preloads it from the <head>, and it is on its way with the stylesheets.
 *
 * It runs after `remark-static-images`, which has made each picture the site
 * holds an `<img src={import}>`. A page whose first picture is far down pays
 * one early fetch.
 *
 * A plain module with no dependency, because Turbopack loads remark plugins by
 * path.
 */
function isImage(node) {
  return (
    node.type === 'image' ||
    ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
      node.name === 'img')
  );
}

function first(node) {
  if (isImage(node)) {
    return node;
  }
  for (const child of node.children ?? []) {
    const found = first(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export default function remarkFirstImageEager() {
  return (tree) => {
    const image = first(tree);
    if (!image) {
      return;
    }
    if (image.type === 'image') {
      // A picture the site does not hold (a remote URL) stays as written.
      return;
    }
    const names = new Set(image.attributes.map((entry) => entry.name));
    for (const [name, value] of [
      ['loading', 'eager'],
      ['fetchPriority', 'high'],
    ]) {
      if (!names.has(name)) {
        image.attributes.push({ type: 'mdxJsxAttribute', name, value });
      }
    }
  };
}
