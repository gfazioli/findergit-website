/**
 * FinderGit Goodies: a paid pack of extras (two screen savers, wallpapers,
 * emoji), sold through a Stripe Payment Link with Managed Payments, so Stripe
 * is the merchant of record, and delivered from the latest release of a
 * private repository.
 *
 * Every value that names the shop comes from the environment. This public
 * repository then carries no private repository name or account id, and the
 * shop's pages answer 404 wherever a value is missing (production, until the
 * shop opens):
 *
 * - `GOODIES_PAYMENT_LINK_URL`: the Payment Link the Buy button opens.
 * - `GOODIES_PAYMENT_LINK_ID`: its id (`plink_…`). The account has other links,
 *   the coffee one among them, and a session paid through any of them must not
 *   unlock the download.
 * - `GOODIES_RELEASES_REPO`: `owner/name` of the private repository.
 * - `GOODIES_GITHUB_TOKEN`: a fine-grained token with Contents: Read on that
 *   repository only.
 * - `STRIPE_SECRET_KEY`: a restricted key with Checkout Sessions: Read only.
 *   Its mode decides whether the shop is live (`rk_live_…`): only a live shop
 *   is indexed and listed in the sitemap.
 *
 * The purchase email has its own, optional settings: `GOODIES_WEBHOOK_SECRET`
 * here, the mail server's in `lib/goodies-mail.ts`.
 */
export interface GoodiesShop {
  paymentLinkUrl: string;
  paymentLinkId: string;
  releasesRepo: string;
  githubToken: string;
  stripeKey: string;
}

/**
 * Read from the environment, trimmed: a value pasted into the Vercel dashboard
 * can carry a newline. One with a control character inside is read as missing:
 * `fetch` rejects such a header with an error that quotes the whole value, and
 * a token would then land in the function log.
 */
export function readSetting(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  if (!value) {
    return undefined;
  }
  if ([...value].some((c) => c < ' ' || c === '\u007f')) {
    console.warn(`[goodies] ${key} holds a control character and is ignored`);
    return undefined;
  }
  return value;
}

export function goodiesShop(env: NodeJS.ProcessEnv = process.env): GoodiesShop | null {
  const read = (key: string) => readSetting(env, key);
  const paymentLinkUrl = read('GOODIES_PAYMENT_LINK_URL');
  const paymentLinkId = read('GOODIES_PAYMENT_LINK_ID');
  const releasesRepo = read('GOODIES_RELEASES_REPO');
  const githubToken = read('GOODIES_GITHUB_TOKEN');
  const stripeKey = read('STRIPE_SECRET_KEY');
  if (!paymentLinkUrl || !paymentLinkId || !releasesRepo || !githubToken || !stripeKey) {
    return null;
  }
  return { paymentLinkUrl, paymentLinkId, releasesRepo, githubToken, stripeKey };
}

/** A shop taking real payments. A test-mode shop (a preview) stays out of search results. */
export function isLiveShop(shop: GoodiesShop): boolean {
  return /^(rk|sk)_live_/.test(shop.stripeKey);
}

/** Whether the shop's pages are for search engines: only once it takes real payments. */
export function goodiesIndexable(env: NodeJS.ProcessEnv = process.env): boolean {
  const shop = goodiesShop(env);
  return shop !== null && isLiveShop(shop);
}

/** The `robots` metadata of a shop page: indexed when `goodiesIndexable`, kept out otherwise. */
export function goodiesRobots(): { index: false; follow: false } | undefined {
  return goodiesIndexable() ? undefined : { index: false, follow: false };
}

/** The Stripe price, as the pages show it. Change it here and in Stripe together. */
export const GOODIES_PRICE = '€5';

export const GOODIES_SUPPORT_EMAIL = 'hello@undolog.com';

/**
 * The two files of a release: the Mac disk image holds everything, the ZIP the
 * pictures alone, for any other system. Matched by suffix, so the version in
 * the names can change.
 */
export const PACK_FILES = {
  mac: '.dmg',
  pictures: '.zip',
} as const;

export type PackKind = keyof typeof PACK_FILES;

export function isPackKind(value: unknown): value is PackKind {
  return typeof value === 'string' && Object.hasOwn(PACK_FILES, value);
}

const FETCH_TIMEOUT_MS = 10_000;

/** Every outside call: never cached, given up after `FETCH_TIMEOUT_MS`. */
const uncached = () => ({
  cache: 'no-store' as const,
  signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
});

/** Every answer of the shop's routes is about one buyer: never cached anywhere. */
export const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * Every failure is logged with its step and status, and never with a token:
 * the buyer only sees "retry shortly", so the function log is the one place
 * that says which of Stripe, the release lookup or the asset redirect failed.
 */
export function warn(step: string, detail: unknown) {
  const text = detail instanceof Error ? `${detail.name}: ${detail.message}` : String(detail);
  console.warn(`[goodies] ${step} failed: ${text}`);
}

/** A Checkout Session id, checked before it goes into a Stripe URL path. */
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,256}$/;

export function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID.test(value);
}

/** The page a buyer's session id opens: the Payment Link's redirect, and the purchase email's link. */
export function thanksUrl(origin: string, sessionId: string): string {
  return `${origin}/goodies/thanks?session_id=${encodeURIComponent(sessionId)}`;
}

/**
 * `unavailable` is kept apart from `unpaid` so the thank-you page can tell a
 * buyer to retry in a moment rather than that we have no record of the payment.
 */
export type SessionCheck = 'paid' | 'unpaid' | 'unavailable';

/** Whether a Checkout Session, as Stripe returns it or a webhook carries it, is a paid checkout of this link. */
export function isPaidSession(shop: GoodiesShop, session: unknown): boolean {
  const s = session as {
    status?: unknown;
    payment_status?: unknown;
    payment_link?: unknown;
  } | null;
  return (
    s?.status === 'complete' &&
    s?.payment_status === 'paid' &&
    s?.payment_link === shop.paymentLinkId
  );
}

/** The webhook's signing secret (`whsec_…`): without it the webhook does not exist. */
export function goodiesWebhookSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  return readSetting(env, 'GOODIES_WEBHOOK_SECRET') ?? null;
}

/**
 * The buyer to write to, when a webhook event says a checkout of this link is
 * paid: `checkout.session.completed` with the payment in, or, for a method that
 * settles later, `checkout.session.async_payment_succeeded`. A completed
 * session still waiting for its payment gets its email from the second event,
 * so no buyer is written to twice, nor before the money is in.
 */
export function paidPurchase(
  shop: GoodiesShop,
  event: unknown
): { sessionId: string; email: string } | null {
  const e = event as { type?: unknown; data?: { object?: unknown } } | null;
  if (
    e?.type !== 'checkout.session.completed' &&
    e?.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return null;
  }
  const session = e.data?.object as
    | { id?: unknown; customer_details?: { email?: unknown } | null }
    | undefined;
  const email = session?.customer_details?.email;
  if (!isPaidSession(shop, session) || !isSessionId(session?.id)) {
    return null;
  }
  return typeof email === 'string' && email.includes('@') ? { sessionId: session.id, email } : null;
}

/**
 * Whether `sessionId` is a completed, paid checkout of the Goodies link.
 *
 * Asked of Stripe on every call and never cached: it is the download's only
 * gate. The session id is the buyer's key, carried in the thank-you page's URL;
 * whoever holds it can download, like a download link. A later refund does not
 * revoke it: the session stays `paid`, and the files are already out.
 */
export async function checkSession(shop: GoodiesShop, sessionId: string): Promise<SessionCheck> {
  if (!isSessionId(sessionId)) {
    return 'unpaid';
  }
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${shop.stripeKey}` },
      ...uncached(),
    });
    if (response.status === 404) {
      return 'unpaid';
    }
    if (!response.ok) {
      warn('session check', `HTTP ${response.status}`);
      return 'unavailable';
    }
    return isPaidSession(shop, await response.json()) ? 'paid' : 'unpaid';
  } catch (error) {
    warn('session check', error);
    return 'unavailable';
  }
}

function github(shop: GoodiesShop, accept = 'application/vnd.github+json') {
  return {
    api: `https://api.github.com/repos/${shop.releasesRepo}`,
    headers: {
      Accept: accept,
      Authorization: `Bearer ${shop.githubToken}`,
      'User-Agent': 'findergit-website',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
}

/** How many times the asset request follows GitHub's API to itself before giving up. */
const API_HOPS = 3;

/** A file of the pack to hand out: its short-lived URL, and the tag of the release it comes from. */
export interface PackDownload {
  url: string;
  tag: string;
}

/**
 * A short-lived URL of one of the pack's files: the latest release's asset
 * ending in `PACK_FILES[kind]`, as GitHub's signed storage redirect, with the
 * release's tag, which the download's statistics record.
 *
 * The asset endpoint answers a token-bearing request with a 302 to a URL that
 * works without credentials for a few minutes, so the file never passes
 * through this site and the URL is useless once shared late. `latest` skips
 * drafts and pre-releases: a draft is invisible to a read-only token anyway.
 */
export async function packDownload(
  shop: GoodiesShop,
  kind: PackKind
): Promise<PackDownload | null> {
  const { api, headers } = github(shop);
  const suffix = PACK_FILES[kind];
  try {
    const release = await fetch(`${api}/releases/latest`, {
      headers,
      ...uncached(),
    });
    if (!release.ok) {
      warn('latest release lookup', `HTTP ${release.status}`);
      return null;
    }
    const { assets, tag_name: tag } = await release.json();
    const pack = Array.isArray(assets)
      ? assets.find(
          (a: { name?: unknown }) =>
            typeof a?.name === 'string' && a.name.toLowerCase().endsWith(suffix)
        )
      : undefined;
    if (typeof pack?.id !== 'number') {
      warn('asset lookup', `no asset ending in ${suffix}`);
      return null;
    }
    let url = `${api}/releases/assets/${pack.id}`;
    for (let hop = 0; hop < API_HOPS; hop += 1) {
      const asset = await fetch(url, {
        headers: { ...headers, Accept: 'application/octet-stream' },
        redirect: 'manual',
        ...uncached(),
      });
      const location = asset.headers.get('location');
      if (asset.status < 300 || asset.status >= 400 || !location?.startsWith('https://')) {
        warn('asset redirect', `HTTP ${asset.status}`);
        return null;
      }
      if (new URL(location).origin !== new URL(api).origin) {
        // A release always has a tag; the fallback only keeps a malformed answer from costing the file.
        return { url: location, tag: typeof tag === 'string' && tag ? tag : 'unknown' };
      }
      // A renamed repository answers with GitHub's API again: that address needs
      // the token and names the repository, so it is followed here, never handed out.
      url = location;
    }
    warn('asset redirect', 'GitHub kept redirecting to its own API');
    return null;
  } catch (error) {
    warn('download lookup', error);
    return null;
  }
}

/** Where the licence lives in the pack's repository: the same file the disk image carries. */
const LICENCE_PATH = 'pack/License.txt';

/**
 * The pack's licence as plain text: the one in the latest release, which is
 * what a buyer downloads, or the repository's default branch while no release
 * carries one yet. `null` when GitHub cannot be reached.
 */
export async function packLicence(shop: GoodiesShop): Promise<string | null> {
  const { api, headers } = github(shop);
  const raw = github(shop, 'application/vnd.github.raw+json').headers;
  const options = (h: Record<string, string>) => ({ headers: h, ...uncached() });
  try {
    const release = await fetch(`${api}/releases/latest`, options(headers));
    // Only a release that does not exist yet (404) falls back to the default branch: after a
    // failed lookup the branch may hold terms no buyer has downloaded.
    if (!release.ok && release.status !== 404) {
      warn('licence release lookup', `HTTP ${release.status}`);
      return null;
    }
    const tag = release.ok ? (await release.json())?.tag_name : undefined;
    for (const ref of typeof tag === 'string' ? [tag, ''] : ['']) {
      const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
      const file = await fetch(`${api}/contents/${LICENCE_PATH}${query}`, options(raw));
      if (file.ok) {
        return await file.text();
      }
      if (file.status !== 404) {
        warn('licence lookup', `HTTP ${file.status}`);
        return null;
      }
    }
    warn('licence lookup', 'no licence in the latest release or on the default branch');
    return null;
  } catch (error) {
    warn('licence lookup', error);
    return null;
  }
}

export type LicenceBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

export interface LicenceSection {
  heading: string;
  blocks: LicenceBlock[];
}

export interface Licence {
  version: string;
  sections: LicenceSection[];
}

/**
 * The licence's plain text, read as the page shows it. The file is written for
 * a text editor: a title line (the page has its own) and a version line, then
 * sections whose heading is a line in capitals, paragraphs separated by blank
 * lines and wrapped at 80 columns, and lists of `- ` items whose wrapped lines
 * are indented.
 */
export function parseLicence(text: string): Licence {
  const groups = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((group) => group.split('\n').filter((line) => line.trim() !== ''))
    .filter((lines) => lines.length > 0);
  const [head = [], ...rest] = groups;
  const licence: Licence = { version: head[1]?.trim() ?? '', sections: [] };
  const joined = (lines: string[]) => lines.map((line) => line.trim()).join(' ');

  for (const lines of rest) {
    if (lines.length === 1 && /^[A-Z][A-Z ,'-]*$/.test(lines[0].trim())) {
      licence.sections.push({ heading: lines[0].trim(), blocks: [] });
      continue;
    }
    if (licence.sections.length === 0) {
      licence.sections.push({ heading: '', blocks: [] });
    }
    const { blocks } = licence.sections[licence.sections.length - 1];
    if (lines[0].trimStart().startsWith('- ')) {
      const items: string[][] = [];
      for (const line of lines) {
        if (line.trimStart().startsWith('- ')) {
          items.push([line.trimStart().slice(2)]);
        } else {
          items[items.length - 1]?.push(line);
        }
      }
      blocks.push({ kind: 'list', items: items.map(joined) });
    } else {
      blocks.push({ kind: 'paragraph', text: joined(lines) });
    }
  }
  return licence;
}
