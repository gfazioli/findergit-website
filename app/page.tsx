import { SoftwareApplicationJsonLd } from '@/components/StructuredData/StructuredData';
import { fetchReleaseCadence } from '@/components/ReleaseCadence/fetch-release-cadence';
import { Welcome } from '@/components/Welcome/Welcome';

/**
 * Regenerated on a timer so the hero's release strip stays honest between
 * deploys. Without it the page is built once per release and its relative
 * freshness phrase ("Updated today") would freeze at whatever it said on
 * release day, which is precisely the failure the strip is meant to avoid.
 *
 * Six hours, not the hour this used to be, because `formatFreshness` counts
 * WHOLE UTC DAYS: the value the rebuild exists to refresh cannot change more
 * than once a day, so an hourly regeneration was twenty-four times finer than
 * its own granularity. It is not free, either - each regeneration invalidates
 * the page in every CDN region holding it, and each of those regions then
 * re-reads a few hundred KB of HTML back out of the ISR store, which is the
 * meter this is aimed at. The trade is a bounded lag: the phrase can sit up to
 * six hours behind the UTC day boundary that would have changed it.
 */
export const revalidate = 21600;

export default async function HomePage() {
  const cadence = await fetchReleaseCadence();

  return (
    <>
      <SoftwareApplicationJsonLd />
      <Welcome cadence={cadence} />
    </>
  );
}
