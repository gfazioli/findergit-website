/**
 * @jest-environment node
 *
 * The helpers build real `Response`s and read their headers, which jsdom does
 * not provide.
 */
import {
  checkSession,
  goodiesShop,
  goodiesIndexable,
  isLiveShop,
  isPackKind,
  isSessionId,
  packDownload,
  packLicence,
  paidPurchase,
  parseLicence,
  thanksUrl,
  type GoodiesShop,
} from './goodies';

const SHOP: GoodiesShop = {
  paymentLinkUrl: 'https://buy.example.test/goodies',
  paymentLinkId: 'plink_goodies',
  releasesRepo: 'owner/goodies',
  githubToken: 'github-token',
  stripeKey: 'rk_test_key',
};

const SESSION = 'cs_test_a1B2c3';
const SIGNED = 'https://files.example.test/pack.zip?sig=abc';

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe('goodiesShop', () => {
  const full = {
    GOODIES_PAYMENT_LINK_URL: SHOP.paymentLinkUrl,
    GOODIES_PAYMENT_LINK_ID: SHOP.paymentLinkId,
    GOODIES_RELEASES_REPO: SHOP.releasesRepo,
    GOODIES_GITHUB_TOKEN: SHOP.githubToken,
    STRIPE_SECRET_KEY: SHOP.stripeKey,
  } as unknown as NodeJS.ProcessEnv;

  it('is open only when every value is set', () => {
    expect(goodiesShop(full)).toEqual(SHOP);
    for (const key of Object.keys(full)) {
      expect(goodiesShop({ ...full, [key]: '' })).toBeNull();
    }
  });

  it('trims a value pasted with a newline, and treats a blank one as missing', () => {
    expect(goodiesShop({ ...full, GOODIES_GITHUB_TOKEN: ' github-token\n' })?.githubToken).toBe(
      'github-token'
    );
    expect(goodiesShop({ ...full, STRIPE_SECRET_KEY: ' \n' })).toBeNull();
  });
});

describe('isSessionId', () => {
  it('accepts Checkout Session ids only', () => {
    expect(isSessionId('cs_test_a1B2c3')).toBe(true);
    expect(isSessionId('cs_live_a1B2c3')).toBe(true);
    for (const bad of ['', 'cs_test_', 'cs_test_../x', 'pi_123', 'cs_test_a?b=1', 42]) {
      expect(isSessionId(bad)).toBe(false);
    }
  });
});

describe('checkSession', () => {
  const paid = { status: 'complete', payment_status: 'paid', payment_link: SHOP.paymentLinkId };

  it('says paid for a completed, paid session of this link', async () => {
    const fetchMock = jest.fn(async () => json(200, paid));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(checkSession(SHOP, SESSION)).resolves.toBe('paid');
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      `https://api.stripe.com/v1/checkout/sessions/${SESSION}`
    );
  });

  it('refuses a session paid through another link, such as the coffee one', async () => {
    global.fetch = jest.fn(async () =>
      json(200, { ...paid, payment_link: 'plink_coffee' })
    ) as unknown as typeof fetch;

    await expect(checkSession(SHOP, SESSION)).resolves.toBe('unpaid');
  });

  it('refuses a session that is open or unpaid', async () => {
    global.fetch = jest.fn(async () =>
      json(200, { ...paid, status: 'open', payment_status: 'unpaid' })
    ) as unknown as typeof fetch;

    await expect(checkSession(SHOP, SESSION)).resolves.toBe('unpaid');
  });

  it('says unpaid for an unknown session, unavailable when Stripe fails', async () => {
    global.fetch = jest.fn(async () => json(404, {})) as unknown as typeof fetch;
    await expect(checkSession(SHOP, SESSION)).resolves.toBe('unpaid');

    global.fetch = jest.fn(async () => json(500, {})) as unknown as typeof fetch;
    await expect(checkSession(SHOP, SESSION)).resolves.toBe('unavailable');

    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    await expect(checkSession(SHOP, SESSION)).resolves.toBe('unavailable');
  });

  it('never asks Stripe about something that is not a session id', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(checkSession(SHOP, '../../v1/charges')).resolves.toBe('unpaid');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('packDownload', () => {
  function github(assets: unknown, assetStatus = 302) {
    return jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(200, { tag_name: 'v1.0', assets })
        : new Response(null, { status: assetStatus, headers: { location: SIGNED } })
    );
  }
  const RELEASE = [
    { id: 1, name: 'SHA256SUMS.txt' },
    { id: 2, name: 'FinderGit-Goodies-1.0.DMG' },
    { id: 3, name: 'FinderGit-Goodies-Wallpapers-1.0.zip' },
  ];

  it('resolves each kind to its own asset, by suffix, as a signed URL with its release tag', async () => {
    for (const [kind, id] of [
      ['mac', 2],
      ['pictures', 3],
    ] as const) {
      const fetchMock = github(RELEASE);
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(packDownload(SHOP, kind)).resolves.toEqual({ url: SIGNED, tag: 'v1.0' });
      const [assetUrl, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
      expect(assetUrl).toBe(`https://api.github.com/repos/owner/goodies/releases/assets/${id}`);
      expect(init.redirect).toBe('manual');
    }
  });

  it('gives nothing when the release has no such asset or GitHub fails', async () => {
    global.fetch = github([{ id: 1, name: 'FinderGit-Goodies.dmg' }]) as unknown as typeof fetch;
    await expect(packDownload(SHOP, 'pictures')).resolves.toBeNull();

    global.fetch = github([{ id: 2, name: 'pack.dmg' }], 404) as unknown as typeof fetch;
    await expect(packDownload(SHOP, 'mac')).resolves.toBeNull();

    global.fetch = jest.fn(async () => json(404, {})) as unknown as typeof fetch;
    await expect(packDownload(SHOP, 'mac')).resolves.toBeNull();
  });

  it('still hands out the file when the release answers without a tag', async () => {
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(200, { assets: RELEASE })
        : new Response(null, { status: 302, headers: { location: SIGNED } })
    ) as unknown as typeof fetch;

    await expect(packDownload(SHOP, 'mac')).resolves.toEqual({ url: SIGNED, tag: 'unknown' });
  });
});

describe('isPackKind', () => {
  it('knows the two files and nothing else', () => {
    expect(isPackKind('mac')).toBe(true);
    expect(isPackKind('pictures')).toBe(true);
    for (const bad of ['', 'zip', 'toString', '__proto__', 1]) {
      expect(isPackKind(bad)).toBe(false);
    }
  });
});

describe('isLiveShop', () => {
  it('is live only with a live-mode key', () => {
    expect(isLiveShop(SHOP)).toBe(false);
    expect(isLiveShop({ ...SHOP, stripeKey: 'rk_live_abc' })).toBe(true);
    expect(isLiveShop({ ...SHOP, stripeKey: 'sk_live_abc' })).toBe(true);
    expect(isLiveShop({ ...SHOP, stripeKey: 'sk_test_live_' })).toBe(false);
  });
});

describe('goodiesIndexable', () => {
  const env = {
    GOODIES_PAYMENT_LINK_URL: 'https://buy.example.test/goodies',
    GOODIES_PAYMENT_LINK_ID: 'plink_goodies',
    GOODIES_RELEASES_REPO: 'owner/goodies',
    GOODIES_GITHUB_TOKEN: 'github-token',
    STRIPE_SECRET_KEY: 'rk_live_key',
  } as unknown as NodeJS.ProcessEnv;

  it('indexes a live shop only', () => {
    expect(goodiesIndexable(env)).toBe(true);
    expect(goodiesIndexable({ ...env, STRIPE_SECRET_KEY: 'rk_test_key' })).toBe(false);
    expect(goodiesIndexable({ ...env, GOODIES_RELEASES_REPO: '' })).toBe(false);
  });
});

describe('thanksUrl', () => {
  it('builds the download page for a session on the given origin', () => {
    expect(thanksUrl('https://findergit.app', 'cs_live_a1')).toBe(
      'https://findergit.app/goodies/thanks?session_id=cs_live_a1'
    );
  });
});

describe('paidPurchase', () => {
  const session = {
    object: 'checkout.session',
    id: 'cs_test_a1B2c3',
    status: 'complete',
    payment_status: 'paid',
    payment_link: SHOP.paymentLinkId,
    customer_details: { email: 'buyer@example.test' },
  };
  const event = (type: string, object: unknown = session) => ({ type, data: { object } });

  it('names the buyer of a paid checkout of this link', () => {
    for (const type of ['checkout.session.completed', 'checkout.session.async_payment_succeeded']) {
      expect(paidPurchase(SHOP, event(type))).toEqual({
        sessionId: 'cs_test_a1B2c3',
        email: 'buyer@example.test',
      });
    }
  });

  it('waits for the money: a completed session still unpaid sends nothing yet', () => {
    expect(
      paidPurchase(
        SHOP,
        event('checkout.session.completed', { ...session, payment_status: 'unpaid' })
      )
    ).toBeNull();
  });

  it('ignores other links, other events, and sessions without an email', () => {
    expect(
      paidPurchase(
        SHOP,
        event('checkout.session.completed', { ...session, payment_link: 'plink_coffee' })
      )
    ).toBeNull();
    expect(paidPurchase(SHOP, event('checkout.session.expired'))).toBeNull();
    expect(paidPurchase(SHOP, event('charge.refunded'))).toBeNull();
    expect(
      paidPurchase(
        SHOP,
        event('checkout.session.completed', { ...session, customer_details: null })
      )
    ).toBeNull();
    expect(
      paidPurchase(SHOP, event('checkout.session.completed', { ...session, id: '../x' }))
    ).toBeNull();
    expect(paidPurchase(SHOP, null)).toBeNull();
  });
});

describe('packLicence', () => {
  const raw = (url: string, tag?: string) =>
    url.includes('/contents/pack/License.txt') &&
    (tag ? url.endsWith(`?ref=${tag}`) : !url.includes('?ref='));

  it('reads the licence of the latest release', async () => {
    const fetchMock = jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(200, { tag_name: 'v0.2.0' })
        : raw(url, 'v0.2.0')
          ? new Response('FINDERGIT GOODIES LICENCE', { status: 200 })
          : json(500, {})
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(packLicence(SHOP)).resolves.toBe('FINDERGIT GOODIES LICENCE');
  });

  it('falls back to the default branch while the latest release has none', async () => {
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(200, { tag_name: 'v0.1.0' })
        : raw(url)
          ? new Response('FROM MAIN', { status: 200 })
          : json(404, {})
    ) as unknown as typeof fetch;

    await expect(packLicence(SHOP)).resolves.toBe('FROM MAIN');
  });

  it('falls back while no release exists yet', async () => {
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(404, {})
        : raw(url)
          ? new Response('FROM MAIN', { status: 200 })
          : json(404, {})
    ) as unknown as typeof fetch;

    await expect(packLicence(SHOP)).resolves.toBe('FROM MAIN');
  });

  it('never shows the default branch after a failed release lookup', async () => {
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/releases/latest')
        ? json(502, {})
        : new Response('UNRELEASED TERMS', { status: 200 })
    ) as unknown as typeof fetch;

    await expect(packLicence(SHOP)).resolves.toBeNull();
  });

  it('gives nothing when GitHub fails', async () => {
    global.fetch = jest.fn(async () => json(500, {})) as unknown as typeof fetch;
    await expect(packLicence(SHOP)).resolves.toBeNull();
  });
});

describe('parseLicence', () => {
  const TEXT = [
    'FINDERGIT GOODIES LICENCE',
    'Version 1, November 2026',
    '',
    'An opening paragraph, wrapped',
    'over two lines.',
    '',
    'WHAT YOU MAY NOT DO',
    '',
    '- Sell or share the files. If someone likes them, point',
    '  them to findergit.app.',
    '- Train a model on them.',
    '',
    'QUESTIONS',
    '',
    'hello@undolog.com',
    '',
  ].join('\r\n');

  it('reads headings, wrapped paragraphs and wrapped list items', () => {
    expect(parseLicence(TEXT)).toEqual({
      version: 'Version 1, November 2026',
      sections: [
        {
          heading: '',
          blocks: [{ kind: 'paragraph', text: 'An opening paragraph, wrapped over two lines.' }],
        },
        {
          heading: 'WHAT YOU MAY NOT DO',
          blocks: [
            {
              kind: 'list',
              items: [
                'Sell or share the files. If someone likes them, point them to findergit.app.',
                'Train a model on them.',
              ],
            },
          ],
        },
        { heading: 'QUESTIONS', blocks: [{ kind: 'paragraph', text: 'hello@undolog.com' }] },
      ],
    });
  });
});
