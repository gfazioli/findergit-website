/**
 * @jest-environment node
 */
import { createHmac } from 'node:crypto';
import { SIGNATURE_TOLERANCE_S, verifyStripeSignature } from './stripe-webhook';

const SECRET = 'whsec_test_secret';
const NOW = 1_800_000_000;
const PAYLOAD = Buffer.from('{"id":"evt_1","type":"checkout.session.completed","note":"caffè"}');

/** A header as Stripe writes it: the HMAC of `${t}.${payload}`, keyed with the whole secret. */
function sign(payload: Buffer, t = NOW, secret = SECRET) {
  const v1 = createHmac('sha256', secret).update(`${t}.`).update(payload).digest('hex');
  return `t=${t},v1=${v1}`;
}

describe('verifyStripeSignature', () => {
  it('accepts what Stripe signed, multibyte characters included', () => {
    expect(verifyStripeSignature(PAYLOAD, sign(PAYLOAD), SECRET, NOW)).toBe(true);
  });

  it('accepts any of several signatures, as while the secret is rolled', () => {
    const header = `t=${NOW},v1=${'0'.repeat(64)},${sign(PAYLOAD).split(',')[1]},v0=ignored`;
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, NOW)).toBe(true);
  });

  it('refuses a changed payload, another secret, or no signature', () => {
    const changed = Buffer.from(PAYLOAD.toString().replace('evt_1', 'evt_2'));
    expect(verifyStripeSignature(changed, sign(PAYLOAD), SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(PAYLOAD, sign(PAYLOAD, NOW, 'whsec_other'), SECRET, NOW)).toBe(
      false
    );
    expect(verifyStripeSignature(PAYLOAD, null, SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(PAYLOAD, `t=${NOW}`, SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(PAYLOAD, 'garbage', SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(PAYLOAD, `t=${NOW},v1=xyz`, SECRET, NOW)).toBe(false);
  });

  it('refuses an event older or newer than the tolerance, so it cannot be replayed', () => {
    const old = NOW - SIGNATURE_TOLERANCE_S - 1;
    expect(verifyStripeSignature(PAYLOAD, sign(PAYLOAD, old), SECRET, NOW)).toBe(false);
    expect(
      verifyStripeSignature(PAYLOAD, sign(PAYLOAD, NOW - SIGNATURE_TOLERANCE_S), SECRET, NOW)
    ).toBe(true);
    expect(
      verifyStripeSignature(PAYLOAD, sign(PAYLOAD, NOW + SIGNATURE_TOLERANCE_S + 1), SECRET, NOW)
    ).toBe(false);
  });
});
