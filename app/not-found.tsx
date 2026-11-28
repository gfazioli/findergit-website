import { IconFileUnknown } from '@tabler/icons-react';
import { Button, Center, EmptyState, EmptyStateActions } from '@mantine/core';
import { Link } from '@/components/Link/Link';

export const metadata = {
  title: 'Page not found',
};

/** The 404 page, on Mantine's `EmptyState`. */
export default function NotFound() {
  return (
    <Center flex={1} py={80} px="md">
      <EmptyState
        size="lg"
        icon={<IconFileUnknown size={36} stroke={1.5} />}
        title="This page does not exist"
        description="The link may be broken, or the page may have moved. Search the docs with ⌘K, or start again from the home page."
      >
        <EmptyStateActions>
          <Button component={Link} href="/">
            Home
          </Button>
          <Button component={Link} href="/docs" variant="default">
            Documentation
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </Center>
  );
}
