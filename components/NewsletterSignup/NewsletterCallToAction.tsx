import { IconMail } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@mantine/core';

/**
 * The shared newsletter call-to-action (heading + blurb + Subscribe button),
 * used both in the footer band (NewsletterSignup) and the scroll-triggered
 * popup (NewsletterModal) so the copy and link stay in one place.
 *
 * Links to the FinderGit Substack publication, which hosts the subscribe form.
 */
export function NewsletterCallToAction() {
  return (
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
  );
}
