import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SkipNavContent } from 'nextra/components';
import { Anchor, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { checkSession, GOODIES_SUPPORT_EMAIL, goodiesShop, type PackKind } from '@/lib/goodies';
import { emailsPurchaseLink } from '@/lib/goodies-mail';

/**
 * Where the Payment Link sends a buyer after paying, with the Checkout Session
 * id in `session_id`, and where the purchase email's link opens. The id is the
 * buyer's key to the download, so the page sends no referrer anywhere and
 * stays out of search results.
 */
export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

function Support({ lead }: { lead: string }) {
  return (
    <Text c="dimmed" size="sm">
      {`${lead} Write to `}
      <Anchor href={`mailto:${GOODIES_SUPPORT_EMAIL}`}>{GOODIES_SUPPORT_EMAIL}</Anchor>
      {' with your receipt number.'}
    </Text>
  );
}

export default async function GoodiesThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const shop = goodiesShop();
  if (!shop) {
    notFound();
  }

  const { session_id: raw } = await searchParams;
  const sessionId = typeof raw === 'string' ? raw : '';
  const check = sessionId ? await checkSession(shop, sessionId) : 'unpaid';
  // A plain <a>, never next/link: no RSC fetch may follow the download's redirect.
  const download = (kind: PackKind) =>
    `/api/goodies/download?session_id=${encodeURIComponent(sessionId)}&kind=${kind}`;

  return (
    <>
      <SkipNavContent />
      <main>
        <Container size="sm" py={64}>
          {check === 'paid' ? (
            <Stack gap="lg">
              <Title order={1}>Thank you!</Title>
              <Text size="lg">
                FinderGit Goodies is yours, and your receipt is on its way by email.
              </Text>
              <Group gap="md">
                <Button component="a" href={download('mac')} size="lg" rel="nofollow noreferrer">
                  Download for Mac
                </Button>
                <Button
                  component="a"
                  href={download('pictures')}
                  size="lg"
                  variant="default"
                  rel="nofollow noreferrer"
                >
                  Pictures only (ZIP)
                </Button>
              </Group>
              <Text>
                The Mac disk image holds everything: the two screen savers, their preview app, the
                wallpapers, the extras and a Read Me with the steps. The ZIP has the pictures alone,
                for any other system.
              </Text>
              <Text>
                {emailsPurchaseLink()
                  ? 'We have also emailed you the link to this page. It keeps working, and always serves the latest version of the pack.'
                  : 'Bookmark this page: its link keeps working, and always serves the latest version of the pack.'}
              </Text>
              <Support lead="Something wrong?" />
            </Stack>
          ) : (
            <Stack gap="lg">
              <Title order={1}>
                {check === 'unavailable' ? 'One moment, please' : 'We could not confirm a purchase'}
              </Title>
              <Text>
                {check === 'unavailable'
                  ? 'We could not check your payment just now. Reload this page in a minute.'
                  : 'This link does not match a completed purchase. If you have just paid, reload this page in a few seconds.'}
              </Text>
              <Support lead="Still stuck?" />
            </Stack>
          )}
        </Container>
      </main>
    </>
  );
}
