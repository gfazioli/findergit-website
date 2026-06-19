'use client';

import { IconMail } from '@tabler/icons-react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

/**
 * Newsletter signup CTA.
 *
 * Links to the FinderGit Substack publication (findergit.substack.com), which
 * hosts the subscribe form (double opt-in + bot protection on Substack's side).
 * A button rather than the raw Substack embed: the cross-origin embed renders
 * an opaque white card (its `transparent` param is ignored) that can't be
 * restyled to fit the dark footer. The macOS app links to the same publication.
 */
export function NewsletterSignup() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs" align="center">
        <Title order={3} ta="center">
          Get release updates
        </Title>
        <Text c="dimmed" ta="center" size="sm" maw={420}>
          New version of FinderGit? Be the first to know — straight to your inbox.
        </Text>
        <Button
          component="a"
          href="https://findergit.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconMail size={16} />}
          radius="xl"
          mt="xs"
        >
          Subscribe for updates
        </Button>
      </Stack>
    </Container>
  );
}
