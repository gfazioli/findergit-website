import { checkSession, goodiesShop, isPackKind, NO_STORE, packDownload } from '@/lib/goodies';
import { recordDownload } from '@/lib/goodies-events';

/**
 * `/api/goodies/download?session_id=…&kind=mac|pictures`: checks with Stripe
 * that the session is a paid checkout of the Goodies link, then redirects to a
 * short-lived URL of the file asked for: the Mac disk image (the default) or
 * the pictures' ZIP. Linked from the thank-you page with a plain `<a>`, never
 * `next/link`, so no RSC fetch ever follows this redirect (see `/download`).
 *
 * Each redirect is counted in the site's statistics (`lib/goodies-events.ts`):
 * GitHub counts no download of a private release's files, so this is the only
 * count there is. A refused or failed request counts nothing.
 *
 * `Referrer-Policy: no-referrer` keeps the session id, which is the buyer's
 * key, out of the request to the file host.
 */
export async function GET(request: Request) {
  const shop = goodiesShop();
  if (!shop) {
    return new Response('Not found', { status: 404, headers: NO_STORE });
  }

  const query = new URL(request.url).searchParams;
  const kind = query.get('kind') ?? 'mac';
  if (!isPackKind(kind)) {
    return Response.json({ error: 'Unknown file' }, { status: 400, headers: NO_STORE });
  }
  const sessionId = query.get('session_id') ?? '';
  const check = await checkSession(shop, sessionId);
  if (check !== 'paid') {
    return Response.json(
      { error: check === 'unavailable' ? 'Payment check unavailable, retry shortly' : 'Not paid' },
      { status: check === 'unavailable' ? 503 : 403, headers: NO_STORE }
    );
  }

  const file = await packDownload(shop, kind);
  if (!file) {
    return Response.json(
      { error: 'Download unavailable, retry shortly' },
      { status: 503, headers: NO_STORE }
    );
  }

  await recordDownload(request, sessionId, file.tag, kind);
  return new Response(null, {
    status: 302,
    headers: { ...NO_STORE, Location: file.url, 'Referrer-Policy': 'no-referrer' },
  });
}
