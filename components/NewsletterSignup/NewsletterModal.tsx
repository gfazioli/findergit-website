'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { GOODIES_WASH, GoodiesCallToAction } from './GoodiesCallToAction';
import { NewsletterCallToAction } from './NewsletterCallToAction';
import { closedRecently, DISMISSED_KEY, PROMPT_OPEN_ATTRIBUTE } from './prompt-open';

/**
 * Scroll-triggered newsletter prompt.
 *
 * Once the visitor has scrolled past the hero, a dismissible modal with the
 * Goodies as a promotion, and the shared newsletter CTA under them, appears:
 * at most once a page load, and not for a day once closed. Closing it stores
 * the time in localStorage, and a visit 24 hours later sees it again
 * (`PROMPT_RETURNS_AFTER_MS`). Mounted once globally in the root layout.
 *
 * The Goodies (`GoodiesCallToAction`) stay out on the shop's own pages, where
 * they would point at the page behind the overlay: there the newsletter is
 * alone, as it is in the footer.
 */
const SCROLL_TRIGGER_PX = 1200;

function isDismissed() {
  try {
    return closedRecently(window.localStorage.getItem(DISMISSED_KEY), Date.now());
  } catch {
    return false;
  }
}

export function NewsletterModal() {
  const [opened, { open, close }] = useDisclosure(false);
  // Read as it opens and kept: the link to the shop closes the prompt as it
  // navigates there, and the Goodies must not vanish while it fades out.
  const [inShop, setInShop] = useState(false);
  // The prompt is open, or was closed where storage could not keep the time:
  // then it does not open again in this page load. Closed with the time kept,
  // the stored day decides, as on a later visit (Codex, round 2).
  const asked = useRef(false);
  // A client navigation keeps the root layout, and this with it: each new
  // page asks again whether the day it stays closed is over, or a tab left
  // open since the day it was closed would never see it again (Codex, round 1).
  const pathname = usePathname();

  // Watches the scroll only until the prompt opens, at most once a frame, and
  // not at all for a visitor who has closed it in the last day. Mantine's
  // `useWindowScroll`, which it replaces, rendered on every scroll event for as
  // long as any page was open: 574 renders in a 13 s scroll down the home
  // page, three quarters of the script the scroll ran (production, CPU 4x,
  // 2026-10-13).
  useEffect(() => {
    if (asked.current || isDismissed()) {
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
        // Once, until it is closed. Closed in another tab since this one
        // loaded counts as closed here too.
        stop();
        if (!isDismissed()) {
          asked.current = true;
          setInShop(window.location.pathname.startsWith('/goodies'));
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
  }, [open, pathname]);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }
    document.documentElement.setAttribute(PROMPT_OPEN_ATTRIBUTE, 'open');
    return () => document.documentElement.removeAttribute(PROMPT_OPEN_ATTRIBUTE);
  }, [opened]);

  const handleClose = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      asked.current = false;
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
      transitionProps={{ transition: 'pop' }}
      // On the element with role="dialog", which has no title to be named by.
      // A plain `aria-label` lands on the modal's root <div>, where it names
      // nothing (read in Chrome on lancetta.app, 2026-10-19).
      attributes={{
        content: {
          'aria-label': inShop
            ? 'Subscribe to the FinderGit newsletter'
            : 'The FinderGit newsletter and Goodies',
        },
      }}
      // The button the focus lands on as it opens: an icon alone names nothing.
      closeButtonProps={{ 'aria-label': 'Close' }}
      // The pack's light, on the dialog itself so it reaches the top edge: the
      // header over it is clear, or its own ground would cut the light off
      // above the pictures.
      styles={
        inShop
          ? undefined
          : {
              content: { backgroundImage: GOODIES_WASH, backgroundRepeat: 'no-repeat' },
              header: { backgroundColor: 'transparent' },
            }
      }
    >
      {!inShop && <GoodiesCallToAction onNavigate={handleClose} />}
      <NewsletterCallToAction quiet={!inShop} />
    </Modal>
  );
}
