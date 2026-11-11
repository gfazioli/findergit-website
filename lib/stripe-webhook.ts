import { createHmac, timingSafeEqual } from 'node:crypto';

/** How old a signed event may be, in seconds: Stripe's own libraries allow five minutes. */
export const SIGNATURE_TOLERANCE_S = 300;

/**
 * Whether `payload` is what Stripe sent and signed for this endpoint.
 *
 * The `Stripe-Signature` header carries a timestamp `t` and one or more `v1`
 * signatures (two while the endpoint's secret is being rolled): each is the
 * HMAC-SHA256, keyed with the endpoint secret (`whsec_…`, used whole), of
 * `${t}.${payload}`, the raw bytes exactly as they arrived. An old timestamp
 * is refused even with a good signature, so a captured event cannot be
 * replayed later.
 */
export function verifyStripeSignature(
  payload: Buffer,
  header: string | null,
  secret: string,
  nowS: number = Math.floor(Date.now() / 1000)
): boolean {
  if (!header) {
    return false;
  }
  let timestamp: number | undefined;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const at = part.indexOf('=');
    if (at < 0) {
      continue;
    }
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (key === 't' && /^\d+$/.test(value)) {
      timestamp = Number(value);
    } else if (key === 'v1' && /^[0-9a-f]{64}$/.test(value)) {
      signatures.push(value);
    }
  }
  if (timestamp === undefined || signatures.length === 0) {
    return false;
  }
  if (Math.abs(nowS - timestamp) > SIGNATURE_TOLERANCE_S) {
    return false;
  }
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.`, 'utf8')
    .update(payload)
    .digest();
  return signatures.some((signature) => timingSafeEqual(Buffer.from(signature, 'hex'), expected));
}
