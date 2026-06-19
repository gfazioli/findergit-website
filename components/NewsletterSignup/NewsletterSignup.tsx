'use client';

import { Container, Stack } from '@mantine/core';

/**
 * Newsletter signup band.
 *
 * Embeds the FinderGit Substack publication's subscribe form
 * (findergit.substack.com). Substack hosts the form — double opt-in and bot
 * protection are handled on their side, so no API token or custom subscribe
 * endpoint lives on ours. The macOS app links to the same publication's
 * /subscribe page, so web and app feed one list.
 */
export function NewsletterSignup() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center">
        <iframe
          src="https://findergit.substack.com/embed?transparent=1&light=1"
          title="Subscribe to FinderGit"
          width={480}
          height={320}
          scrolling="no"
          style={{ border: 0, background: 'transparent', maxWidth: '100%' }}
        />
      </Stack>
    </Container>
  );
}
