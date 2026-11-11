import type { Metadata } from 'next';
import NextImage from 'next/image';
import { notFound } from 'next/navigation';
import { SkipNavContent } from 'nextra/components';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  GridCol,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import classes from '@/components/Goodies/Goodies.module.css';
import { GoodiesInside } from '@/components/Goodies/GoodiesInside';
import config from '@/config';
import { GOODIES_PRICE, GOODIES_SUPPORT_EMAIL, goodiesRobots, goodiesShop } from '@/lib/goodies';
import { emailsPurchaseLink } from '@/lib/goodies-mail';

const DESCRIPTION =
  'Two screen savers, wallpapers for Mac and iPhone, video-call backgrounds and pixel folder emoji from FinderGit. Every purchase helps keep FinderGit free.';

/**
 * The shop exists only where `lib/goodies.ts` finds its environment, and is
 * indexed only once it takes real payments: a test-mode preview stays out of
 * search results, and production answers 404 until the shop opens. The page
 * is built with the environment it finds, so a changed setting needs a
 * redeploy.
 */
export function generateMetadata(): Metadata {
  return {
    title: 'FinderGit Goodies: screen savers, wallpapers and emoji',
    description: DESCRIPTION,
    alternates: { canonical: '/goodies' },
    robots: goodiesRobots(),
    openGraph: {
      ...config.metadata.openGraph,
      url: '/goodies',
      title: 'FinderGit Goodies',
      description: DESCRIPTION,
      images: [{ url: '/goodies/goodies-saver-mainline.jpg', width: 1280, height: 720 }],
    },
  };
}

const SAVERS = [
  [
    'mainline',
    'FinderGit Mainline',
    'A flight over an endless, invented commit graph. Branches fork from the main line and merge back, pushes run ahead as pulses of light, and releases stand up as beacons.',
  ],
  [
    'streak',
    'FinderGit Streak',
    'A wall of contribution calendars filling in a day a second, with commits arriving as comets. The past scrolls away; today lights up where the wall meets the days to come.',
  ],
] as const;

const WALLPAPERS = [
  ['branch-lines', 'Branch Lines'],
  ['commit-galaxy', 'Commit Galaxy'],
  ['contribution-city', 'Contribution City'],
  ['merge-rivers', 'Merge Rivers'],
  ['christmas', 'Christmas'],
] as const;

/**
 * The gallery's column, in rem like the layout (Mantine's lg Container, its
 * padding and the grid's gap): one picture a row on a phone, two from 48em,
 * three from 75em, never wider than a third of the 71.25rem container.
 */
const GALLERY_SIZES =
  '(width < 48em) calc(100vw - 2rem), (width < 75em) calc(50vw - 2.5rem), 22rem';

/** The hero's pair: the left column of the 71.25rem container from 62em, the full width below it. */
const HERO_SIZES = '(width < 48em) calc(100vw - 2rem), (width < 75em) 45vw, 34rem';

/** A saver's still, two to a row from 48em. */
const SAVER_SIZES = '(width < 48em) calc(100vw - 2rem), (width < 75em) calc(50vw - 2.5rem), 34rem';

const EYEBROW = {
  size: 'sm',
  fw: 700,
  tt: 'uppercase',
  c: 'findergit.3',
  style: { letterSpacing: 3 },
} as const;

function BuyButton({ href }: { href: string }) {
  return (
    <Button component="a" href={href} size="xl" rel="nofollow">
      {`Buy for ${GOODIES_PRICE}`}
    </Button>
  );
}

export default function GoodiesPage() {
  const shop = goodiesShop();
  if (!shop) {
    notFound();
  }
  const emailsTheLink = emailsPurchaseLink();

  return (
    <>
      <SkipNavContent />
      <main>
        <Box pos="relative" className={`fg-home ${classes.heroGround}`}>
          <Container size="lg" py={64}>
            <Grid gap={{ base: 40, md: 56 }} align="center">
              <GridCol span={{ base: 12, md: 6 }}>
                <Stack gap="lg" className={classes.night}>
                  <Badge size="lg" variant="filled" w="fit-content">
                    {GOODIES_PRICE}, one-off
                  </Badge>
                  <Title order={1} fz={{ base: 36, sm: 52 }} fw={900} lh={1.05}>
                    Bring FinderGit to your whole Mac
                  </Title>
                  <Text c="dimmed" size="xl">
                    Two screen savers, wallpapers for every screen, video-call backgrounds and pixel
                    folder emoji, made from FinderGit’s world. Every purchase helps keep FinderGit
                    free.
                  </Text>
                  <Box>
                    <BuyButton href={shop.paymentLinkUrl} />
                  </Box>
                  <Text c="dimmed" size="sm">
                    {`${GOODIES_PRICE}, VAT included · One-time purchase · The screen savers need macOS 15.6 or later`}
                  </Text>
                </Stack>
              </GridCol>
              <GridCol span={{ base: 12, md: 6 }}>
                <div className={classes.pair}>
                  <NextImage
                    className={`${classes.picture} ${classes.shadowed} ${classes.pairBack}`}
                    src="/goodies/goodies-saver-mainline.jpg"
                    alt="FinderGit Mainline: a flight over a glowing commit graph"
                    width={1280}
                    height={720}
                    sizes={HERO_SIZES}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <NextImage
                    className={`${classes.picture} ${classes.shadowed} ${classes.pairFront}`}
                    src="/goodies/goodies-saver-streak.jpg"
                    alt="FinderGit Streak: a wall of contribution calendars filling in"
                    width={1280}
                    height={720}
                    sizes={HERO_SIZES}
                    loading="eager"
                  />
                </div>
              </GridCol>
            </Grid>
          </Container>
        </Box>

        <Container size="lg" py={64}>
          <Stack align="center" gap="md" mb={40}>
            <Text {...EYEBROW}>In the pack</Text>
            <Title order={2} ta="center" fz={{ base: 30, sm: 40 }} fw={900}>
              One download, everything inside
            </Title>
          </Stack>
          <GoodiesInside />
        </Container>

        <Container size="lg" py={64}>
          <Stack align="center" gap="md" mb={40}>
            <Text {...EYEBROW}>The screen savers</Text>
            <Title order={2} ta="center" fz={{ base: 30, sm: 40 }} fw={900}>
              Two ways to leave your Mac alone
            </Title>
            <Text c="dimmed" ta="center" maw={680}>
              Neither one reads a repository, runs git or touches the network: everything in them is
              invented on your Mac, so they work on any Mac. Three colour palettes each and a
              settings sheet. macOS 15.6 or later, Apple silicon and Intel.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            {SAVERS.map(([id, name, text]) => (
              <Stack key={id} gap="sm">
                <NextImage
                  className={`${classes.picture} ${classes.shadowed}`}
                  src={`/goodies/goodies-saver-${id}.jpg`}
                  alt={`${name}, as it plays on screen`}
                  width={1280}
                  height={720}
                  sizes={SAVER_SIZES}
                  loading="lazy"
                />
                <Title order={3} fz="lg" fw={700}>
                  {name}
                </Title>
                <Text c="dimmed" size="sm">
                  {text}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>

        <Container size="lg" py={64}>
          <Stack align="center" gap="md" mb={40}>
            <Text {...EYEBROW}>The designs</Text>
            <Title order={2} ta="center" fz={{ base: 30, sm: 40 }} fw={900}>
              Five pictures, every screen
            </Title>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {WALLPAPERS.map(([id, name]) => (
              <Stack key={id} gap="xs">
                <NextImage
                  className={classes.picture}
                  src={`/goodies/goodies-wallpaper-${id}.jpg`}
                  alt={`The ${name} wallpaper`}
                  width={1280}
                  height={720}
                  sizes={GALLERY_SIZES}
                  loading="lazy"
                />
                <Text size="sm" fw={600}>
                  {name}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>

        <Container size="sm" py={64}>
          <Stack gap="lg">
            <Title order={2} fz={{ base: 28, sm: 34 }} fw={900}>
              How you get it
            </Title>
            <Text>
              <strong>Pay once.</strong> Checkout is secure, the price includes VAT, and your
              receipt comes by email.
            </Text>
            <Text>
              <strong>Download.</strong> You land on your download page: the Mac disk image holds
              everything, and the pictures also come on their own as a ZIP, for any other system.
            </Text>
            <Text>
              <strong>Come back any time.</strong>
              {emailsTheLink
                ? ' We email you the link to your download page, and it always serves the latest version of the pack.'
                : ' Bookmark your download page: it always serves the latest version of the pack.'}
            </Text>
            <Text>
              <strong>Yours to use.</strong> Everything is licensed for your own devices, for
              yourself and your own work. <Anchor href="/goodies/licence">Read the licence</Anchor>.
            </Text>
          </Stack>
        </Container>

        <Container size="sm" pb={80}>
          <Stack align="center" gap="md" ta="center">
            <Title order={2} fz={{ base: 28, sm: 34 }} fw={900}>
              Every purchase helps keep FinderGit free
            </Title>
            <BuyButton href={shop.paymentLinkUrl} />
            <Text c="dimmed" size="sm">
              {'Questions? Write to '}
              <Anchor href={`mailto:${GOODIES_SUPPORT_EMAIL}`}>{GOODIES_SUPPORT_EMAIL}</Anchor>
              {'.'}
            </Text>
          </Stack>
        </Container>
      </main>
    </>
  );
}
