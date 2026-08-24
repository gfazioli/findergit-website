// Liveness check for the AI commit-message proxy.
//
// Exists because nothing was watching /api/ai-commit: Groq decommissioned the
// model it asked for on 2026-08-16, every request had been failing since, and
// we found out from a user eight days later (FinderGit#154). This route makes
// that state machine-checkable -- point a monitor at it and the next
// decommission is caught the day it lands, not the day someone complains.
//
// GET returns 200 only when the configured model is one Groq will actually
// serve. Anything else is 503 with a `reason` that says which half is broken.

import { resolveModel } from '../model';

const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

// The check hits a third party, so a burst of requests (a monitor with a tight
// interval, a crawler) shouldn't turn into a burst of upstream calls. Groq's
// model list changes on the scale of weeks; 60 s of caching is invisible to a
// monitor and bounds the fan-out.
const CACHE_TTL_MS = 60 * 1000;
let cached: { at: number; status: number; body: Record<string, unknown> } | null = null;

function respond(status: number, body: Record<string, unknown>): Response {
  cached = { at: Date.now(), status, body };
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(): Promise<Response> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.body, {
      status: cached.status,
      headers: { 'Cache-Control': 'no-store', 'X-Health-Cache': 'hit' },
    });
  }

  const model = resolveModel();

  if (!process.env.GROQ_API_KEY) {
    return respond(503, { ok: false, reason: 'missing_api_key', model });
  }

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
  } catch {
    return respond(503, { ok: false, reason: 'upstream_unreachable', model });
  }

  if (!upstream.ok) {
    // 401 here means the key itself is the problem, which is worth
    // distinguishing from a model that has gone away.
    return respond(503, {
      ok: false,
      reason: upstream.status === 401 ? 'invalid_api_key' : 'upstream_error',
      status: upstream.status,
      model,
    });
  }

  let ids: string[];
  try {
    const json = (await upstream.json()) as { data?: Array<{ id?: unknown }> };
    ids = (json.data ?? []).map((entry) => String(entry.id));
  } catch {
    return respond(503, { ok: false, reason: 'invalid_upstream_response', model });
  }

  if (!ids.includes(model)) {
    return respond(503, { ok: false, reason: 'model_unavailable', model });
  }

  return respond(200, { ok: true, model });
}
