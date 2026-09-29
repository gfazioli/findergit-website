import type { MetadataRoute } from 'next';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import config from '@/config';

/**
 * Build-time sitemap. Enumerates the MDX pages under `content/` (served by
 * Nextra at `/docs/...`) plus the homepage, so crawlers get the full URL set
 * — there was no sitemap before, which left discovery entirely to internal
 * linking.
 *
 * No `lastModified`, on any URL. It used to be each file's mtime, and on
 * Vercel that is the moment the build cloned the repository: all 18 docs
 * pages carried the same date, which moved on every deploy whether or not a
 * page had changed (2026-09-29 audit). A date that is always "now" is a
 * signal crawlers learn to ignore; none at all is the honest one, as the
 * homepage already had.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.metadata.metadataBase.toString().replace(/\/$/, '');
  const contentDir = path.join(process.cwd(), 'content');

  const docs: MetadataRoute.Sitemap = readdirSync(contentDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const url = slug === 'index' ? `${base}/docs` : `${base}/docs/${slug}`;
      // The docs landing and the release notes are the liveliest pages.
      const priority = slug === 'index' || slug === 'release-notes' ? 0.9 : 0.8;
      return { url, changeFrequency: 'weekly', priority };
    });

  return [{ url: `${base}/`, changeFrequency: 'weekly', priority: 1 }, ...docs];
}
