'use client';

import { Box, CloseButton, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import classes from './Banner.module.css';

export interface BannerProps {
  /** Dismissing is remembered under this key: change it (say, per version) to show the banner again */
  storageKey: string;
  children: React.ReactNode;
}

/**
 * A dismissible announcement strip, Nextra's `<Banner>` on Mantine.
 *
 * The small inline script hides a dismissed banner before the first paint: without it a returning
 * reader would see it flash, since `localStorage` is only readable once the page is in the browser.
 */
export function Banner({ storageKey, children }: BannerProps) {
  const key = `banner:${storageKey}`;
  const [dismissed, setDismissed] = useLocalStorage({
    key,
    defaultValue: false,
    getInitialValueInEffect: true,
  });

  if (dismissed) {
    return null;
  }

  return (
    <>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(key)})==='true')document.documentElement.setAttribute('data-banner-dismissed','')}catch(e){}`,
        }}
      />
      <Box className={classes.banner} role="region" aria-label="Announcement" data-site-banner>
        <Text size="sm" fw={500} className={classes.text}>
          {children}
        </Text>
        <CloseButton
          size="sm"
          variant="transparent"
          className={classes.close}
          aria-label="Dismiss the announcement"
          onClick={() => setDismissed(true)}
        />
      </Box>
    </>
  );
}
