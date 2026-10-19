'use client';

import { useEffect } from 'react';
import { Modal } from '@mantine/core';
import { readLocalStorageValue, useDisclosure, useReducedMotion } from '@mantine/hooks';
import { NewsletterCallToAction } from './NewsletterCallToAction';
import { DISMISSED_KEY, PROMPT_OPEN_ATTRIBUTE } from './prompt-open';

/**
 * Scroll-triggered newsletter prompt.
 *
 * Once the visitor has scrolled past the hero, a dismissible modal with the
 * shared newsletter CTA appears — but only once: closing it persists a flag in
 * localStorage so it never nags again on future visits. Mounted once globally
 * in the root layout.
 */
const SCROLL_TRIGGER_PX = 1200;

const isDismissed = () => readLocalStorageValue({ key: DISMISSED_KEY, defaultValue: false });

export function NewsletterModal() {
  const [opened, { open, close }] = useDisclosure(false);
  // Mantine ignores Reduce Motion unless the theme opts in, and this one does
  // not: the pop and the overlay's fade are skipped by hand.
  const reduced = useReducedMotion();

  // Watches the scroll only until the prompt opens, at most once a frame, and
  // not at all for a visitor who has closed it. Mantine's `useWindowScroll`,
  // which it replaces, rendered on every scroll event for as long as any page
  // was open: 574 renders in a 13 s scroll down the home page, three quarters
  // of the script the scroll ran (production, CPU 4x, 2026-10-13).
  useEffect(() => {
    if (isDismissed()) {
      return undefined;
    }
    let frame = 0;
    function stop() {
      window.removeEventListener('scroll', scrolled);
      window.cancelAnimationFrame(frame);
    }
    function check() {
      frame = 0;
      if (window.scrollY > SCROLL_TRIGGER_PX) {
        // At most once per page load. Closed in another tab since this one
        // loaded counts as closed here too.
        stop();
        if (!isDismissed()) {
          open();
        }
      }
    }
    function scrolled() {
      if (!frame) {
        frame = window.requestAnimationFrame(check);
      }
    }
    window.addEventListener('scroll', scrolled, { passive: true });
    // A page that opens already past the trigger (a reload, a link to an
    // anchor) gets the prompt as a scroll there would have given it.
    scrolled();
    return stop;
  }, [open]);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }
    document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    return () => document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
  }, [opened]);

  const handleClose = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(true));
    } catch {
      // Storage refused (site data blocked, a full quota): it closes for this
      // page load, and the watcher has already stopped.
    }
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
      transitionProps={{ transition: 'pop', duration: reduced ? 0 : 250 }}
      // On the element with role="dialog", which has no title to be named by.
      // A plain `aria-label` lands on the modal's root <div>, where it names
      // nothing (read in Chrome on lancetta.app, 2026-10-19).
      attributes={{ content: { 'aria-label': 'Subscribe to the FinderGit newsletter' } }}
      // The button the focus lands on as it opens: an icon alone names nothing.
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
      <NewsletterCallToAction />
    </Modal>
  );
}
