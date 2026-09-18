import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CADENCE_REVALIDATE_SECONDS } from './fetch-release-cadence';

/**
 * Next requires a segment's `revalidate` to be statically analysable, so the
 * homepage cannot import the constant it has to agree with. Read the literal
 * back out of the source instead.
 */
function homeRevalidateLiteral(): number {
  const source = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
  const match = source.match(/^export const revalidate = (\d+);$/m);
  if (!match) {
    throw new Error('app/page.tsx has no `export const revalidate = <number>;` to read');
  }
  return Number(match[1]);
}

describe('homepage revalidate', () => {
  it('agrees with the cadence fetch, which would otherwise clamp it', () => {
    // A fetch revalidate BELOW the page's wins silently: the segment takes the
    // minimum of the two, so raising only the export looks applied and changes
    // nothing. Measured on 2026-09-18 at 21600 against 3600, where the build
    // kept writing 3600 into the prerender manifest.
    expect(homeRevalidateLiteral()).toBe(CADENCE_REVALIDATE_SECONDS);
  });
});
