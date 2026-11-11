'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react';

/**
 * Pages whose query string is a key: the Goodies thank-you page's `session_id`
 * opens a buyer's files for good, and the purchase email links to it. Its
 * `no-referrer` keeps the id out of outgoing requests, not out of a script
 * that reads `location`, so the visit statistics drop the query here.
 */
const KEYED_PAGES = ['/goodies/thanks'];

/** The URL as the statistics record it: a keyed page without its query and fragment. */
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!KEYED_PAGES.some((page) => u.pathname === page || u.pathname.startsWith(`${page}/`))) {
      return url;
    }
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

const redact = (event: BeforeSendEvent): BeforeSendEvent => ({
  ...event,
  url: redactUrl(event.url),
});

/** The site's cookie-free visit statistics, in a client component so it can take `beforeSend`. */
export function SiteAnalytics() {
  return <Analytics beforeSend={redact} />;
}
