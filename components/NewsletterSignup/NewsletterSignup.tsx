'use client';

import { Container } from '@mantine/core';
import { NewsletterCallToAction } from './NewsletterCallToAction';

/**
 * Newsletter signup band shown at the top of the footer (every page).
 * Renders the shared CTA, which links to the FinderGit Substack publication.
 */
export function NewsletterSignup() {
  return (
    <Container size="sm" py="xl">
      <NewsletterCallToAction />
    </Container>
  );
}
