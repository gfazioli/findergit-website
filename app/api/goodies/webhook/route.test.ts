/**
 * @jest-environment node
 *
 * Route handlers build a real `Response`, which jsdom does not provide.
 */
import { createHmac } from 'node:crypto';
import { recordPurchase } from '../../../../lib/goodies-events';
import { sendPurchaseEmail } from '../../../../lib/goodies-mail';
import { POST } from './route';

jest.mock('../../../../lib/goodies-events', () => ({ recordPurchase: jest.fn() }));
const recorded = jest.mocked(recordPurchase);

jest.mock('../../../../lib/goodies-mail', () => ({
  ...jest.requireActual('../../../../lib/goodies-mail'),
  sendPurchaseEmail: jest.fn(async () => undefined),
}));
const send = sendPurchaseEmail as unknown as jest.Mock;

const SECRET = 'whsec_test';
const ENV = {
  GOODIES_PAYMENT_LINK_URL: 'https://buy.example.test/goodies',
  GOODIES_PAYMENT_LINK_ID: 'plink_goodies',
  GOODIES_RELEASES_REPO: 'owner/goodies',
  GOODIES_GITHUB_TOKEN: 'github-token',
  STRIPE_SECRET_KEY: 'rk_test_key',
  GOODIES_WEBHOOK_SECRET: SECRET,
  GOODIES_SMTP_USER: 'user',
  GOODIES_SMTP_PASS: 'pass',
  GOODIES_MAIL_FROM: 'goodies@example.test',
};
const SESSION = {
  object: 'checkout.session',
  id: 'cs_test_abc',
  status: 'complete',
  payment_status: 'paid',
  payment_link: 'plink_goodies',
  customer_details: { email: 'buyer@example.test' },
};

function post(event: unknown, { secret = SECRET, t = Math.floor(Date.now() / 1000) } = {}) {
  const body = JSON.stringify(event);
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return new Request('https://findergit.test/api/goodies/webhook', {
    method: 'POST',
    body,
    headers: { 'Stripe-Signature': `t=${t},v1=${v1}` },
  });
}
const completed = (object: unknown = SESSION) => ({
  type: 'checkout.session.completed',
  data: { object },
});

const originalEnv = { ...process.env };
beforeEach(() => {
  Object.assign(process.env, ENV);
  send.mockClear();
  send.mockImplementation(async () => undefined);
  recorded.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  process.env = { ...originalEnv };
  jest.restoreAllMocks();
});

describe('POST /api/goodies/webhook', () => {
  it('emails the buyer of a paid checkout the link to their download page', async () => {
    const response = await POST(post(completed()));

    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0].slice(1)).toEqual([
      'buyer@example.test',
      'https://findergit.test/goodies/thanks?session_id=cs_test_abc',
    ]);
  });

  it('counts the paid checkout in the statistics, once per delivery, and nothing else', async () => {
    await POST(post(completed()));
    expect(recorded).toHaveBeenCalledTimes(1);
    expect(recorded.mock.calls[0][1]).toBe('cs_test_abc');

    recorded.mockClear();
    await POST(post({ type: 'customer.created', data: { object: {} } }));
    await POST(post(completed({ ...SESSION, payment_link: 'plink_coffee' })));
    expect(recorded).not.toHaveBeenCalled();
  });

  it('refuses an unsigned, missigned or stale request, and sends nothing', async () => {
    const unsigned = new Request('https://findergit.test/api/goodies/webhook', {
      method: 'POST',
      body: JSON.stringify(completed()),
    });
    expect((await POST(unsigned)).status).toBe(400);
    expect((await POST(post(completed(), { secret: 'whsec_other' }))).status).toBe(400);
    expect(
      (await POST(post(completed(), { t: Math.floor(Date.now() / 1000) - 3600 }))).status
    ).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('acknowledges and ignores every other event', async () => {
    expect((await POST(post(completed({ ...SESSION, payment_link: 'plink_coffee' })))).status).toBe(
      200
    );
    expect((await POST(post(completed({ ...SESSION, payment_status: 'unpaid' })))).status).toBe(
      200
    );
    expect((await POST(post({ type: 'charge.refunded', data: { object: {} } }))).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('answers 500 when the mail server refuses, so Stripe retries', async () => {
    send.mockImplementation(async () => Promise.reject(new Error('421 try later')));

    expect((await POST(post(completed()))).status).toBe(500);
  });

  it('sells without the email: acknowledged, nothing sent, when mail is not set up', async () => {
    delete process.env.GOODIES_SMTP_PASS;

    expect((await POST(post(completed()))).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('does not exist without the shop or its signing secret', async () => {
    delete process.env.GOODIES_WEBHOOK_SECRET;
    expect((await POST(post(completed()))).status).toBe(404);
    process.env.GOODIES_WEBHOOK_SECRET = SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    expect((await POST(post(completed()))).status).toBe(404);
  });
});
