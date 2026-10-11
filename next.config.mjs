import bundleAnalyzer from '@next/bundle-analyzer';
import nextra from 'nextra';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextra = nextra({
  // No `latex`: nothing on the site is math, and it shipped KaTeX to every page.
  search: {
    codeblocks: false,
  },
  contentDirBasePath: '/docs',
});

export default withNextra(
  withBundleAnalyzer({
    reactStrictMode: false,
    cleanDistDir: true,
    // AVIF first, WebP for a browser that cannot take it. Next picks the format
    // from the browser's Accept header and caches each apart: every current
    // browser takes AVIF, so the transformations Vercel bills move to AVIF, and
    // a WebP is made only for one that cannot. The first request for each one
    // encodes longer.
    images: {
      formats: ['image/avif', 'image/webp'],
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
