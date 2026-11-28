'use client';

import { useEffect } from 'react';
import { IconBrandGithub, IconPackage } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Skeleton,
  Stack,
  Text,
  Timeline,
  TimelineItem,
  Typography,
} from '@mantine/core';
import config from '@/config';
import { TOC_REFRESH_EVENT } from '@/lib/docs/routes';
import { useReleaseNotes, type Release } from './use-release-notes';
import classes from './ReleaseNotes.module.css';

/**
 * A release's line in the page's table of contents: `v0.78.0 - Nov, 2026`, the
 * month of the day it was created, as the Nextra page listed it.
 */
export function tocLabel(release: Pick<Release, 'tag_name' | 'created_at'>): string {
  const month = new Date(release.created_at)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .replace(' ', ', ');
  return `${release.tag_name} - ${month}`;
}

/**
 * `initialReleases` is what the build compiled, so the releases are in the
 * served HTML for crawlers and the browser makes no request. Without it (the
 * build could not reach GitHub) the component fetches at runtime instead.
 *
 * Each release joins the docs engine's table of contents (`data-toc-entry`);
 * the releases fetched at runtime arrive after it read the page, so it is asked
 * to read it again.
 */
export function ReleaseNotes({ initialReleases }: { initialReleases?: Release[] }) {
  const { data, error, isLoading } = useReleaseNotes(initialReleases);

  useEffect(() => {
    if (data.length > 0) {
      window.dispatchEvent(new Event(TOC_REFRESH_EVENT));
    }
  }, [data]);

  if (error) {
    return (
      <Alert my={32} icon="⚠️" title="Failed to load releases" color="red">
        {error}
      </Alert>
    );
  }

  if (isLoading || data.length === 0) {
    return (
      <Stack mt={24} w="100%" align="center">
        <Group>
          <Text>Loading releases...</Text>
          <Loader type="dots" />
        </Group>
        <Skeleton height={200} width="100%" radius={12} />
        <Skeleton height={50} width="100%" radius={12} />
        <Skeleton height={20} width="100%" radius={12} />
      </Stack>
    );
  }

  return (
    <Stack mt={24}>
      <Timeline active={1} bulletSize={32} lineWidth={4}>
        {data.map((release: Release) => (
          <TimelineItem
            id={release.tag_name}
            className={classes.item}
            key={release.id}
            data-toc-entry
            data-toc-depth={3}
            data-toc-value={tocLabel(release)}
            bullet={<IconPackage size={20} />}
            title={<Badge size="xl">{release.tag_name}</Badge>}
          >
            <Text size="sm" fw={800} mb={16}>
              {release.displayDate}
            </Text>
            {release.body ? (
              <Typography className={classes.body}>
                <div dangerouslySetInnerHTML={{ __html: release.body }} />
              </Typography>
            ) : (
              // A body that would not compile is shown as it was written rather
              // than dropped: see `compileReleaseBodies`.
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {release.rawBody}
              </Text>
            )}
          </TimelineItem>
        ))}
      </Timeline>
      <Button
        color="orange"
        component="a"
        href={config.releaseNotes.url}
        variant="gradient"
        size="sm"
        gradient={{ from: 'dark.9', to: 'dark.8', deg: 45 }}
        leftSection={<IconBrandGithub size={18} />}
        radius="xl"
      >
        View full changelog on GitHub
      </Button>
    </Stack>
  );
}
