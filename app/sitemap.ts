import type { MetadataRoute } from 'next';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import config from '@/config';

/**
 * Build-time sitemap. Enumerates the MDX pages under `content/` (served by
 * Nextra at `/docs/...`) plus the homepage, so crawlers get the full URL set
 * — there was no sitemap before, which left discovery entirely to internal
 * linking. `lastModified` comes from each file's mtime so re-crawls are
 * scoped to pages that actually changed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.metadata.metadataBase.toString().replace(/\/$/, '');
  const contentDir = path.join(process.cwd(), 'content');

  const docs: MetadataRoute.Sitemap = readdirSync(contentDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const url = slug === 'index' ? `${base}/docs` : `${base}/docs/${slug}`;
      let lastModified = new Date();
      try {
        lastModified = statSync(path.join(contentDir, file)).mtime;
      } catch {
        // Fall back to build time if the stat fails.
      }
      // The docs landing and the release notes are the liveliest pages.
      const priority = slug === 'index' || slug === 'release-notes' ? 0.9 : 0.8;
      return { url, lastModified, changeFrequency: 'weekly', priority };
    });

  // No `lastModified` on the homepage: there's no single content file to
  // stat, and a build-time `new Date()` would report it as changed on every
  // deploy, nudging needless recrawls. Omitting it is the honest signal.
  return [{ url: `${base}/`, changeFrequency: 'weekly', priority: 1 }, ...docs];
}
