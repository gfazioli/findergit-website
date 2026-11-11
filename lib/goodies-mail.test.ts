/**
 * @jest-environment node
 */
import nodemailer from 'nodemailer';
import {
  emailsPurchaseLink,
  goodiesMail,
  purchaseMessage,
  sendPurchaseEmail,
} from './goodies-mail';

jest.mock('nodemailer', () => ({ __esModule: true, default: { createTransport: jest.fn() } }));
const createTransport = nodemailer.createTransport as unknown as jest.Mock;

const ENV = {
  GOODIES_SMTP_USER: 'user',
  GOODIES_SMTP_PASS: 'pass\n',
  GOODIES_MAIL_FROM: 'FinderGit Goodies <goodies@example.test>',
} as unknown as NodeJS.ProcessEnv;
const PAGE = 'https://findergit.app/goodies/thanks?session_id=cs_live_a1&x=<b>';

describe('goodiesMail', () => {
  it('needs the account and the sender, and defaults the server', () => {
    expect(goodiesMail(ENV)).toEqual({
      host: 'smtp.sender.net',
      port: 587,
      user: 'user',
      pass: 'pass',
      from: 'FinderGit Goodies <goodies@example.test>',
    });
    for (const key of Object.keys(ENV)) {
      expect(goodiesMail({ ...ENV, [key]: ' ' })).toBeNull();
    }
  });

  it('takes another server, and ignores a port that is not one', () => {
    expect(
      goodiesMail({ ...ENV, GOODIES_SMTP_HOST: 'smtp.example.test', GOODIES_SMTP_PORT: '465' })
    ).toMatchObject({ host: 'smtp.example.test', port: 465 });
    expect(goodiesMail({ ...ENV, GOODIES_SMTP_PORT: 'abc' })?.port).toBe(587);
  });
});

describe('emailsPurchaseLink', () => {
  it('needs both the mail server and the webhook secret', () => {
    expect(emailsPurchaseLink(ENV)).toBe(false);
    expect(emailsPurchaseLink({ ...ENV, GOODIES_WEBHOOK_SECRET: 'whsec_x' })).toBe(true);
    expect(
      emailsPurchaseLink({ GOODIES_WEBHOOK_SECRET: 'whsec_x' } as unknown as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});

describe('purchaseMessage', () => {
  it('carries the link in both parts, escaped in the HTML', () => {
    const message = purchaseMessage(PAGE);
    expect(message.subject).toBe('Your FinderGit Goodies download');
    expect(message.text).toContain(PAGE);
    expect(message.html).toContain('session_id=cs_live_a1&#38;x=&#60;b&#62;');
    expect(message.html).not.toContain('<b>');
  });
});

describe('sendPurchaseEmail', () => {
  it('sends one message to the buyer, replies going to support, over STARTTLS', async () => {
    const sendMail = jest.fn(async () => ({}));
    createTransport.mockReturnValue({ sendMail });
    const mail = goodiesMail(ENV)!;

    await sendPurchaseEmail(mail, 'buyer@example.test', PAGE);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.sender.net',
        port: 587,
        secure: false,
        requireTLS: true,
      })
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: mail.from,
        to: 'buyer@example.test',
        replyTo: 'hello@undolog.com',
        subject: 'Your FinderGit Goodies download',
      })
    );
  });

  it('throws when the server refuses, so the event is retried', async () => {
    createTransport.mockReturnValue({
      sendMail: jest.fn(async () => Promise.reject(new Error('550'))),
    });
    await expect(sendPurchaseEmail(goodiesMail(ENV)!, 'buyer@example.test', PAGE)).rejects.toThrow(
      '550'
    );
  });
});
