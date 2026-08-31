import { Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import type { ReleaseCadence as Cadence } from './release-cadence';
import classes from './ReleaseCadence.module.css';

/**
 * The "still being worked on" strip under the hero download buttons.
 *
 * It carries no version number on purpose: the meta line directly above
 * already prints `v{config.app.version}`, and two versions 40px apart is one
 * more place for them to disagree. This element answers a different question -
 * how recently, and how often.
 */
export function ReleaseCadence({ cadence }: { cadence: Cadence }) {
  const { freshness, latestDate, total, since } = cadence;
  const isFresh = freshness !== null;

  return (
    <Paper className={classes.strip} radius="xl" px="xl" py={10} withBorder>
      <Stack gap={2} align="center">
        <Group gap={8} wrap="nowrap">
          {/*
            The live dot appears only alongside a freshness phrase. Past the
            staleness cut-off the strip states a plain date instead, and a
            pulsing "live" indicator next to a months-old date would be
            asserting something the date itself contradicts.
          */}
          {isFresh && <span className={classes.dot} aria-hidden="true" />}
          <Text size="sm" fw={600}>
            {isFresh ? freshness : `Latest release ${latestDate}`}
          </Text>
        </Group>

        <Group gap={6} wrap="wrap" justify="center">
          {total !== null && since !== null && (
            <>
              <Text size="xs" c="dimmed">
                {total} releases since {since}
              </Text>
              <Text size="xs" c="dimmed" aria-hidden="true">
                &middot;
              </Text>
            </>
          )}
          <Anchor href="/docs/release-notes" size="xs" fw={500}>
            What&apos;s new
          </Anchor>
        </Group>
      </Stack>
    </Paper>
  );
}
