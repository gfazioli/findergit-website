import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPage } from '@/components/shell/DocsPage/DocsPage';
import { getDocs, getNeighbours, getPage, loadPageModule } from '@/lib/docs/content';

type Props = {
  params: Promise<{ slug?: string[] }>;
};

// Every page under content/ is prerendered; any other /docs path is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const { pages } = await getDocs();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage((await params).slug ?? []);
  if (!page) {
    notFound();
  }
  const { frontmatter = {}, metadata = {} } = await loadPageModule(page);
  const description =
    (metadata.description as string | undefined) ?? (frontmatter.description as string | undefined);

  // `description` only when the page has one: Next.js turns an explicit `undefined` into `null`,
  // which replaced the site's description (config.metadata) instead of inheriting it, so a page
  // without front matter shipped none at all.
  return {
    ...metadata,
    title: (metadata.title as string | undefined) ?? page.title,
    ...(description ? { description } : {}),
  };
}

export default async function Page({ params }: Props) {
  const page = await getPage((await params).slug ?? []);
  if (!page) {
    notFound();
  }
  const { default: Content } = await loadPageModule(page);
  const { previous, next } = await getNeighbours(page);

  return (
    <DocsPage page={page} previous={previous} next={next}>
      <Content />
    </DocsPage>
  );
}
