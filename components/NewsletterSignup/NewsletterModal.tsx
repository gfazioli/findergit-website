'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { useDisclosure, useLocalStorage, useWindowScroll } from '@mantine/hooks';
import { NewsletterCallToAction } from './NewsletterCallToAction';

/**
 * Scroll-triggered newsletter prompt.
 *
 * Once the visitor has scrolled past the hero, a dismissible modal with the
 * shared newsletter CTA appears — but only once: closing it persists a flag in
 * localStorage so it never nags again on future visits. Mounted once globally
 * in the root layout.
 */
const SCROLL_TRIGGER_PX = 1200;

export function NewsletterModal() {
  const [scroll] = useWindowScroll();
  const [opened, { open, close }] = useDisclosure(false);
  const [dismissed, setDismissed] = useLocalStorage({
    key: 'findergit-newsletter-prompt-dismissed',
    defaultValue: false,
    // Read localStorage only after mount, so SSR and first client render agree.
    getInitialValueInEffect: true,
  });
  // Auto-open at most once per page load (independent of the persisted flag).
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed && !dismissed && scroll.y > SCROLL_TRIGGER_PX) {
      setArmed(true);
      open();
    }
  }, [scroll.y, dismissed, armed, open]);

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
