import { SoftwareApplicationJsonLd } from '@/components/StructuredData/StructuredData';
import { Welcome } from '@/components/Welcome/Welcome';

export default function HomePage() {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <Welcome />
    </>
  );
}
