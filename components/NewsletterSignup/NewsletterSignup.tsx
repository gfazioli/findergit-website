'use client';

import Script from 'next/script';
import { Container, Stack, Text, Title } from '@mantine/core';

/**
 * Newsletter signup band.
 *
 * Embeds the hosted Sender form (account 07961bfe4b8790, form bmZpzG).
 * Sender's universal.js scans the DOM for `.sender-form-field` nodes and
 * renders the form into them — the form ships with built-in double opt-in and
 * bot protection, so no API token or custom subscribe endpoint lives on our
 * side. The loader is injected once via next/script (stable id ⇒ no dupes);
 * the footer is part of the root layout, so the target div is always mounted
 * by the time the afterInteractive script runs.
 */
export function NewsletterSignup() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md" align="center">
        <Stack gap={4} align="center">
          <Title order={3} ta="center">
            Stay in the loop
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            Get an email when a new version of FinderGit ships. No spam, unsubscribe anytime.
          </Text>
        </Stack>
        <div
          className="sender-form-field"
          data-sender-form-id="bmZpzG"
          style={{ width: '100%', textAlign: 'left' }}
        />
      </Stack>
      <Script id="sender-universal" strategy="afterInteractive">
        {`(function (s, e, n, d, er) {
  s['Sender'] = er;
  s[er] = s[er] || function () { (s[er].q = s[er].q || []).push(arguments) };
  s[er].l = 1 * new Date();
  s[er].on = function (event, callback) {
    s[er].listeners = s[er].listeners || {};
    (s[er].listeners[event] = s[er].listeners[event] || []).push(callback);
  };
  var a = e.createElement(n), m = e.getElementsByTagName(n)[0];
  a.async = 1; a.src = d; m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://cdn.sender.net/accounts_resources/universal.js', 'sender');
sender('07961bfe4b8790');`}
      </Script>
    </Container>
  );
}
