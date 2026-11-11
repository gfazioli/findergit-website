import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SkipNavContent } from 'nextra/components';
import { Anchor, Container, List, ListItem, Stack, Text, Title } from '@mantine/core';
import { goodiesRobots, goodiesShop, packLicence, parseLicence } from '@/lib/goodies';

/**
 * Rendered on request, never at build: a GitHub hiccup during a deploy must not
 * fail the build, and an error page is not cached, so the next visitor retries.
 * `force-dynamic` also makes every fetch uncached, so each visit reads the
 * licence anew (two small API calls): a page this rarely opened costs nothing,
 * and a release with a new licence shows at once.
 */
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'FinderGit Goodies licence',
    description:
      'What you may and may not do with the FinderGit Goodies pack: the screen savers, wallpapers and emoji are yours to use on your own devices.',
    alternates: { canonical: '/goodies/licence' },
    robots: goodiesRobots(),
  };
}

/** An email address in the licence's text becomes a link; everything else stays text. */
function withLinks(text: string) {
  return text.split(/([\w.+-]+@[\w-]+\.[\w.]+)/).map((part, i) =>
    i % 2 === 1 ? (
      <Anchor key={part} href={`mailto:${part}`}>
        {part}
      </Anchor>
    ) : (
      part
    )
  );
}

/**
 * The licence a buyer agrees to, read from the pack's repository (`packLicence`):
 * the very file the disk image carries, so the page and the pack cannot drift.
 */
export default async function GoodiesLicencePage() {
  const shop = goodiesShop();
  if (!shop) {
    notFound();
  }
  const text = await packLicence(shop);
  if (!text) {
    // Thrown, not a 404: the licence exists, it just could not be read now.
    throw new Error('The FinderGit Goodies licence could not be loaded');
  }
  const licence = parseLicence(text);

  return (
    <>
      <SkipNavContent />
      <main>
        <Container size="sm" py={64}>
          <Stack gap="lg">
            <Title order={1}>FinderGit Goodies licence</Title>
            <Text c="dimmed">{licence.version}</Text>
            {licence.sections.map((section) => (
              <Stack key={section.heading} gap="sm">
                {section.heading && (
                  <Title order={2} fz="xl">
                    {section.heading.charAt(0) + section.heading.slice(1).toLowerCase()}
                  </Title>
                )}
                {section.blocks.map((block, i) =>
                  block.kind === 'list' ? (
                    <List key={i} spacing="xs" listStyleType="disc">
                      {block.items.map((item) => (
                        <ListItem key={item}>{withLinks(item)}</ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text key={i}>{withLinks(block.text)}</Text>
                  )
                )}
              </Stack>
            ))}
          </Stack>
        </Container>
      </main>
    </>
  );
}
