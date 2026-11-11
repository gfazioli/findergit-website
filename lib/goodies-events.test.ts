/**
 * @jest-environment node
 *
 * The events take a real `Request`, which jsdom does not provide.
 */
import { track } from '@vercel/analytics/server';
import { buyerTag, recordDownload, recordPurchase } from './goodies-events';

jest.mock('@vercel/analytics/server', () => ({ track: jest.fn() }));
const trackMock = jest.mocked(track);

const SESSION = 'cs_live_a1B2c3D4';
const request = () =>
  new Request(`https://findergit.test/api/goodies/download?session_id=${SESSION}&kind=mac`, {
    headers: {
      'user-agent': 'Safari',
      'x-forwarded-for': '203.0.113.7',
      referer: `https://findergit.test/goodies/thanks?session_id=${SESSION}`,
      cookie: 'a=b',
    },
  });

beforeEach(() => trackMock.mockClear());

describe('buyerTag', () => {
  it('is twelve hex characters, the same for the same session and different across sessions', () => {
    expect(buyerTag(SESSION)).toMatch(/^[0-9a-f]{12}$/);
    expect(buyerTag(SESSION)).toBe(buyerTag(SESSION));
    expect(buyerTag('cs_live_other')).not.toBe(buyerTag(SESSION));
  });
});

describe('recording', () => {
  it('counts a download as buyer, version and file, under a referer that carries no key', async () => {
    await recordDownload(request(), SESSION, 'v0.2.1', 'pictures');

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith(
      'Goodies download',
      { download: `${buyerTag(SESSION)} 0.2.1 pictures` },
      {
        headers: {
          referer: 'https://findergit.test/goodies/thanks',
          'user-agent': 'Safari',
          'x-forwarded-for': '203.0.113.7',
        },
      }
    );
    expect(JSON.stringify(trackMock.mock.calls)).not.toContain(SESSION);
  });

  it('counts a purchase by its buyer', async () => {
    await recordPurchase(request(), SESSION);

    expect(trackMock).toHaveBeenCalledWith(
      'Goodies purchase',
      { buyer: buyerTag(SESSION) },
      { headers: expect.objectContaining({ referer: 'https://findergit.test/goodies' }) }
    );
  });

  it('never fails the request when the statistics do', async () => {
    trackMock.mockRejectedValueOnce(new Error('down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(recordPurchase(request(), SESSION)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
