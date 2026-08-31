import { SoftwareApplicationJsonLd } from '@/components/StructuredData/StructuredData';
import { fetchReleaseCadence } from '@/components/ReleaseCadence/fetch-release-cadence';
import { Welcome } from '@/components/Welcome/Welcome';

/**
 * Regenerated hourly so the hero's release strip stays honest between
 * deploys. Without it the page is built once per release and its relative
 * freshness phrase ("Updated today") would freeze at whatever it said on
 * release day, which is precisely the failure the strip is meant to avoid.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const cadence = await fetchReleaseCadence();

  return (
    <>
      <SoftwareApplicationJsonLd />
      <Welcome cadence={cadence} />
    </>
  );
}
