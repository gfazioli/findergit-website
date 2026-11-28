import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Anchor, Box, Breadcrumbs, Card, Group, SimpleGrid, Text } from '@mantine/core';
import { Link } from '@/components/Link/Link';
import config from '@/config';
import type { DocsPage as DocsPageData } from '@/lib/docs/types';
import { DocsToc } from '../DocsToc/DocsToc';
import classes from './DocsPage.module.css';

type Neighbour = Pick<DocsPageData, 'route' | 'title'> | undefined;

function PageNavigation({ previous, next }: { previous: Neighbour; next: Neighbour }) {
  if (!previous && !next) {
    return null;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xl" component="nav" aria-label="Pagination">
      {previous ? (
        <Card
          component={Link}
          href={previous.route}
          withBorder
          radius="md"
          className={classes.card}
        >
          <Group gap="xs" wrap="nowrap">
            <IconChevronLeft size={18} stroke={1.5} />
            <div>
              <Text size="xs" c="dimmed">
                Previous
              </Text>
              <Text size="sm" fw={500}>
                {previous.title}
              </Text>
            </div>
          </Group>
        </Card>
      ) : (
        <div />
      )}
      {next && (
        <Card component={Link} href={next.route} withBorder radius="md" className={classes.card}>
          <Group gap="xs" wrap="nowrap" justify="flex-end">
            <div className={classes.nextText}>
              <Text size="xs" c="dimmed">
                Next
              </Text>
              <Text size="sm" fw={500}>
                {next.title}
              </Text>
            </div>
            <IconChevronRight size={18} stroke={1.5} />
          </Group>
        </Card>
      )}
    </SimpleGrid>
  );
}

export interface DocsPageProps {
  page: DocsPageData;
  previous?: Neighbour;
  next?: Neighbour;
  children: React.ReactNode;
}

/**
 * One docs page: breadcrumbs (nested pages), the article, the previous / next links, and the
 * table of contents in a sticky column on the right, as on mantine.dev. The article is what
 * Pagefind indexes (`data-pagefind-body`) and what the table of contents reads
 * (`data-docs-article`).
 */
export function DocsPage({ page, previous, next, children }: DocsPageProps) {
  const { theme } = page;
  const crumbs = theme.breadcrumb === false ? [] : page.parents;
  const withToc = theme.toc !== false && theme.layout !== 'full';
  const editUrl = config.docs.editUrlBase ? `${config.docs.editUrlBase}${page.file}` : undefined;

  return (
    <Box className={classes.root} data-layout={theme.layout ?? 'default'} data-toc={withToc}>
      <Box className={classes.content}>
        {crumbs.length > 0 && (
          <Breadcrumbs mb="md" separatorMargin={6} className={classes.breadcrumbs}>
            {crumbs.map((crumb, index) =>
              crumb.route ? (
                <Anchor key={index} component={Link} href={crumb.route} size="sm">
                  {crumb.title}
                </Anchor>
              ) : (
                <Text key={index} size="sm" c="dimmed">
                  {crumb.title}
                </Text>
              )
            )}
            <Text size="sm" fw={500}>
              {page.title}
            </Text>
          </Breadcrumbs>
        )}

        <article data-docs-article data-pagefind-body>
          {children}
        </article>

        {theme.pagination !== false && <PageNavigation previous={previous} next={next} />}
      </Box>

      {withToc && (
        <Box component="aside" className={classes.aside} visibleFrom="lg">
          <DocsToc key={page.route} editUrl={editUrl} />
        </Box>
      )}
    </Box>
  );
}
