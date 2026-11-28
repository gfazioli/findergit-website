import bundleAnalyzer from '@next/bundle-analyzer';
import { fileURLToPath } from 'node:url';
import createMDX from '@next/mdx';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * The docs engine (next-app-mantine-docs-template): plain `@next/mdx`, the MDX loader Next.js
 * itself maintains. This block is the template's, plus the one site plugin marked below; the rest
 * of the file is the site's.
 *
 * Turbopack runs in Rust and cannot receive JavaScript functions, so every remark and rehype
 * plugin is named by a string (a package, or a path to a local module) with serializable options.
 *
 * - `remark-gfm`: tables, task lists, strikethrough, autolinks, as GitHub renders them.
 * - `remark-frontmatter` + `remark-mdx-frontmatter`: the YAML front matter of a page becomes its
 *   `frontmatter` export (`title`, `description`, …).
 * - `remark-heading-ids`: every heading's `id`, from the text as written, before smartypants
 *   changes it (`--` becomes an em dash there, and the anchor would follow).
 * - `remark-smartypants`: curly quotes, dashes and real ellipses in the text, as Nextra set them
 *   (code is left alone).
 * - `remark-static-images`: an image the site holds, next to the page or in `public/`, becomes an
 *   import of the file, served by `next/image`.
 * - `remark-first-image-eager` (the site's, `lib/mdx-site/`): the first picture of a page is
 *   loaded eagerly, with high priority; the others stay lazy.
 * - `rehype-slug`: an `id` on every heading, for the table of contents and for deep links.
 * - `rehype-code-meta`: keeps the fence meta (`filename="…" copy {4}`) on the `<pre>`, where the
 *   code block reads it. MDX drops it otherwise. A local plugin is given by its absolute path:
 *   `@next/mdx` resolves plugin names from its own folder, where a relative path finds nothing.
 */
const withMDX = createMDX({
  extension: /\.mdx$/,
  options: {
    remarkPlugins: [
      'remark-gfm',
      fileURLToPath(new URL('./lib/mdx/remark-heading-ids.mjs', import.meta.url)),
      'remark-smartypants',
      fileURLToPath(new URL('./lib/mdx/remark-static-images.mjs', import.meta.url)),
      // The site's own, after the engine's: the first picture of a page is fetched at once.
      fileURLToPath(new URL('./lib/mdx-site/remark-first-image-eager.mjs', import.meta.url)),
      'remark-frontmatter',
      ['remark-mdx-frontmatter', { name: 'frontmatter' }],
    ],
    rehypePlugins: [
      'rehype-slug',
      fileURLToPath(new URL('./lib/mdx/rehype-code-meta.mjs', import.meta.url)),
    ],
  },
});

export default withMDX(
  withBundleAnalyzer({
    // `server.ts`: the engine's search API is `app/api/search/route.server.ts` (the template
    // names it so that its static export leaves it out; this site has no static export).
    pageExtensions: ['tsx', 'ts', 'server.ts'],
    reactStrictMode: false,
    cleanDistDir: true,
    agentRules: false, // <-- Don't let `next dev` append its block to AGENTS.md (since Next.js v16.3)
    // AVIF first, WebP for a browser that cannot take it. Next picks the format
    // from the browser's Accept header and caches each apart: every current
    // browser takes AVIF, so the transformations Vercel bills move to AVIF, and
    // a WebP is made only for one that cannot. The first request for each one
    // encodes longer.
    images: {
      formats: ['image/avif', 'image/webp'],
    },
    // The shop's pictures and its film (public/goodies) carry no hash in their names: a day
    // fresh, then a week stale while revalidating. Matched by extension because
    // /goodies/thanks and /goodies/licence are pages.
    async headers() {
      return [
        {
          source: '/goodies/:asset([^/]+\\.(?:mp4|jpg))',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, stale-while-revalidate=604800',
            },
          ],
        },
      ];
    },
    experimental: {
      optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    },
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['turbopack-inline-svg-loader'],
          condition: {
            content: /^[\s\S]{0,4000}$/, // <-- Inline SVGs smaller than ~4Kb (since Next.js v16)
          },
          as: '*.js',
        },
      },
    },
  })
);
