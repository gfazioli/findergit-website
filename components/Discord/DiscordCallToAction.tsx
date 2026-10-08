import { IconBrandDiscordFilled } from '@tabler/icons-react';
import { Badge, Button, Container, Text, Title } from '@mantine/core';
import config from '@/config';
import { Reveal } from '@/components/Motion/Reveal';
import { isRecent } from '@/components/Welcome/recent';
import { DISCORD_BLURPLE, discordLinkProps } from './discord';
import classes from './DiscordCallToAction.module.css';

/**
 * The home page's invitation to the Discord server (Undolog's: FinderGit,
 * Netfox, Lancetta and octoscope share it), right under the FAQ: the
 * question the FAQ did not answer is the reason to come. A card on the page's
 * glass, lit from one corner in Discord's blurple; nothing in it moves at rest.
 */
export function DiscordCallToAction() {
  const justOpened = isRecent(config.community.discordSince, config.app.version);
  return (
    <Container size="lg" mb={64}>
      <Reveal variant="rise">
        <section className={classes.card} aria-labelledby="discord-cta-title">
          <div className={classes.mark} aria-hidden>
            <IconBrandDiscordFilled size={34} />
          </div>
          <div className={classes.copy}>
            <div className={classes.heading}>
              <Title order={2} id="discord-cta-title" fz={{ base: 24, sm: 28 }} fw={800}>
                Join the community on Discord
              </Title>
              {justOpened && (
                <Badge size="sm" radius="sm" variant="filled" color={DISCORD_BLURPLE}>
                  Just opened
                </Badge>
              )}
            </div>
            <Text c="dimmed" lh={1.6} mt={6}>
              A question the FAQ doesn&apos;t answer, a bug to talk through, an idea for the next
              release: bring it to the Discord where FinderGit and its sibling apps live, vote on
              what comes next, and talk directly with the maker.
            </Text>
          </div>
          <Button
            component="a"
            {...discordLinkProps}
            size="lg"
            radius="xl"
            color={DISCORD_BLURPLE}
            leftSection={<IconBrandDiscordFilled size={20} />}
            className={classes.button}
          >
            Join the Discord
          </Button>
        </section>
      </Reveal>
    </Container>
  );
}
