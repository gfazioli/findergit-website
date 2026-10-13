'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { readLocalStorageValue, useDisclosure, useLocalStorage } from '@mantine/hooks';
import { NewsletterCallToAction } from './NewsletterCallToAction';
import { PROMPT_OPEN_ATTRIBUTE } from './prompt-open';

/**
 * Scroll-triggered newsletter prompt.
 *
 * Once the visitor has scrolled past the hero, a dismissible modal with the
 * shared newsletter CTA appears — but only once: closing it persists a flag in
 * localStorage so it never nags again on future visits. Mounted once globally
 * in the root layout.
 */
const SCROLL_TRIGGER_PX = 1200;
const DISMISSED_KEY = 'findergit-newsletter-prompt-dismissed';

export function NewsletterModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [dismissed, setDismissed] = useLocalStorage({
    key: DISMISSED_KEY,
    defaultValue: false,
    // Read localStorage only after mount, so SSR and first client render agree.
    getInitialValueInEffect: true,
  });
  // Auto-open at most once per page load (independent of the persisted flag).
  const [armed, setArmed] = useState(false);

  // Watches the scroll only while the prompt can still open, and reads it at
  // most once a frame. It was Mantine's `useWindowScroll`, which renders on
  // every scroll event for as long as the page is open, dismissed or not: on
  // every page of the site, 574 renders in a 13 s scroll down the home page,
  // three quarters of the script the scroll ran (measured on production at
  // CPU 4x, 2026-10-13).
  useEffect(() => {
    if (armed || dismissed) {
      return undefined;
    }
    let frame = 0;
    const check = () => {
      frame = 0;
      // The stored flag rather than `dismissed`, which reads false until
      // useLocalStorage's own effect has run: a visitor who closed the prompt
      // and reloads halfway down the page must not get it back.
      if (
        window.scrollY > SCROLL_TRIGGER_PX &&
        !readLocalStorageValue({ key: DISMISSED_KEY, defaultValue: false })
      ) {
        setArmed(true);
        open();
      }
    };
    const scrolled = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(check);
      }
    };
    window.addEventListener('scroll', scrolled, { passive: true });
    // A page that opens already past the trigger (a reload, a link to an
    // anchor) gets the prompt as a scroll there would have given it.
    scrolled();
    return () => {
      window.removeEventListener('scroll', scrolled);
      window.cancelAnimationFrame(frame);
    };
  }, [armed, dismissed, open]);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }
    document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    return () => document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
  }, [opened]);

  const handleClose = () => {
    setDismissed(true);
    close();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size="md"
      radius="lg"
      overlayProps={{ blur: 2 }}
      transitionProps={{ transition: 'pop' }}
      aria-label="Subscribe to the FinderGit newsletter"
    >
      <NewsletterCallToAction />
    </Modal>
  );
}
