import nodemailer from 'nodemailer';
import { GOODIES_SUPPORT_EMAIL, goodiesWebhookSecret, readSetting } from './goodies';

/**
 * The purchase email: one message per paid checkout, with the link to the
 * buyer's download page, sent by `/api/goodies/webhook`. The payment provider
 * sends the receipt on its own; it cannot carry our link, and a buyer who
 * closes the thank-you page has no other way back to the files.
 *
 * Sent through an SMTP account used for nothing else, so the credential can
 * send mail and do nothing more. All optional: without them the shop still
 * sells and delivers, and the webhook only logs that it sent nothing.
 *
 * - `GOODIES_SMTP_USER`, `GOODIES_SMTP_PASS`: the SMTP account.
 * - `GOODIES_MAIL_FROM`: the sender, e.g. `FinderGit Goodies <goodies@undolog.com>`,
 *   on a domain the mail service has verified (SPF and DKIM), or the message
 *   lands in spam.
 * - `GOODIES_SMTP_HOST` (default `smtp.sender.net`), `GOODIES_SMTP_PORT`
 *   (default 587, STARTTLS).
 */
export interface GoodiesMail {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function goodiesMail(env: NodeJS.ProcessEnv = process.env): GoodiesMail | null {
  const read = (key: string) => readSetting(env, key);
  const user = read('GOODIES_SMTP_USER');
  const pass = read('GOODIES_SMTP_PASS');
  const from = read('GOODIES_MAIL_FROM');
  if (!user || !pass || !from) {
    return null;
  }
  const port = Number(read('GOODIES_SMTP_PORT') ?? 587);
  return {
    host: read('GOODIES_SMTP_HOST') ?? 'smtp.sender.net',
    port: Number.isInteger(port) && port > 0 ? port : 587,
    user,
    pass,
    from,
  };
}

/** Whether a buyer gets the purchase email: the webhook needs its secret, the message a mail server. */
export function emailsPurchaseLink(env: NodeJS.ProcessEnv = process.env): boolean {
  return goodiesMail(env) !== null && goodiesWebhookSecret(env) !== null;
}

export interface PurchaseMessage {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The message itself, plain text first: what a buyer needs is one link and why to keep it. */
export function purchaseMessage(downloadPage: string): PurchaseMessage {
  const lines = [
    'Thank you for buying FinderGit Goodies!',
    '',
    'Your download page:',
    downloadPage,
    '',
    'It always serves the latest version of the pack: the Mac disk image with the two screen savers, the wallpapers and the extras, and the pictures on their own as a ZIP for any other system.',
    '',
    'Keep this email. The link is your key to the files, so please do not share it.',
    '',
    'Your receipt arrives in a separate email.',
    '',
    `Something wrong? Reply to this email, or write to ${GOODIES_SUPPORT_EMAIL}.`,
    '',
    'Every purchase helps keep FinderGit free. Thank you!',
  ];
  const href = escapeHtml(downloadPage);
  const html = [
    '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;font-size:16px;line-height:1.5;color:#1d2433">',
    '<p><strong>Thank you for buying FinderGit Goodies!</strong></p>',
    `<p><a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#2f73cc;color:#ffffff;text-decoration:none;font-weight:600">Open your download page</a></p>`,
    `<p style="font-size:14px;color:#5c6270">Or copy this link: <a href="${href}">${href}</a></p>`,
    '<p>It always serves the latest version of the pack: the Mac disk image with the two screen savers, the wallpapers and the extras, and the pictures on their own as a ZIP for any other system.</p>',
    '<p>Keep this email. The link is your key to the files, so please do not share it.</p>',
    '<p>Your receipt arrives in a separate email.</p>',
    `<p>Something wrong? Reply to this email, or write to <a href="mailto:${GOODIES_SUPPORT_EMAIL}">${GOODIES_SUPPORT_EMAIL}</a>.</p>`,
    '<p>Every purchase helps keep FinderGit free. Thank you!</p>',
    '</body></html>',
  ].join('');
  return { subject: 'Your FinderGit Goodies download', text: lines.join('\n'), html };
}

/** Sends the purchase email; throws when the mail server refuses it, so Stripe retries the event. */
export async function sendPurchaseEmail(mail: GoodiesMail, to: string, downloadPage: string) {
  const transport = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.port === 465,
    requireTLS: mail.port !== 465,
    auth: { user: mail.user, pass: mail.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const message = purchaseMessage(downloadPage);
  await transport.sendMail({ from: mail.from, to, replyTo: GOODIES_SUPPORT_EMAIL, ...message });
}
