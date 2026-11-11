import {
  goodiesShop,
  goodiesWebhookSecret,
  NO_STORE,
  paidPurchase,
  thanksUrl,
  warn,
} from '@/lib/goodies';
import { recordPurchase } from '@/lib/goodies-events';
import { goodiesMail, sendPurchaseEmail } from '@/lib/goodies-mail';
import { verifyStripeSignature } from '@/lib/stripe-webhook';

const answer = (status: number, body: string) => new Response(body, { status, headers: NO_STORE });

/**
 * `/api/goodies/webhook`: Stripe's endpoint for the Goodies checkouts. A paid
 * one gets the purchase email with the link to its download page.
 *
 * Every other event is acknowledged and ignored: the account's other links
 * (the coffee one) may share the endpoint's events. Stripe retries anything
 * but a 2xx for three days, so a refused email answers 500, and a malformed or
 * unsigned request 400, which a retry cannot fix but a log shows.
 *
 * Delivery is at least once: an event Stripe retries after a timeout can send
 * a buyer a second copy of the same link, which is harmless.
 */
export async function POST(request: Request) {
  const shop = goodiesShop();
  const secret = goodiesWebhookSecret();
  if (!shop || !secret) {
    return answer(404, 'Not found');
  }

  // The raw bytes: the signature covers them exactly as they arrived.
  const payload = Buffer.from(await request.arrayBuffer());
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) {
    warn('webhook', 'signature did not verify');
    return answer(400, 'Bad signature');
  }
  let event: unknown;
  try {
    event = JSON.parse(payload.toString('utf8'));
  } catch {
    return answer(400, 'Bad payload');
  }

  const purchase = paidPurchase(shop, event);
  if (!purchase) {
    return answer(200, 'Ignored');
  }
  // Before the email: a retried delivery counts its buyer again, and buyers are what is counted.
  await recordPurchase(request, purchase.sessionId);
  const mail = goodiesMail();
  if (!mail) {
    warn('purchase email', 'no mail settings, nothing sent');
    return answer(200, 'Not sent');
  }
  try {
    // The origin Stripe called: findergit.app in production, the preview's own
    // address for a test-mode endpoint, so the link opens where the session exists.
    await sendPurchaseEmail(
      mail,
      purchase.email,
      thanksUrl(new URL(request.url).origin, purchase.sessionId)
    );
  } catch (error) {
    warn('purchase email', error);
    return answer(500, 'Retry');
  }
  return answer(200, 'Sent');
}
