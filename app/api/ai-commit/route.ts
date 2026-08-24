// AI commit-message proxy used by the FinderGit macOS app.
//
// Flow: FinderGit POSTs a `git diff` plus a small config object; we forward
// it to Groq with a system prompt and return the whole answer in one JSON
// response (no streaming -- a commit message is one shot). The Groq API key
// lives only on Vercel (`GROQ_API_KEY`), so end-users never need to configure
// anything to use the free Auto provider. Which model we ask for is
// `GROQ_MODEL`, defaulting to the value in ./model.ts.
//
// Limits we enforce here:
// - 100 KB max diff size — keeps Groq token usage bounded and free-tier
//   safe while accommodating most real-world commits without false-positive
//   rejections (see commit history for the 50 → 100 KB bump)
// - 30 requests/hour per IP — in-memory best-effort rate limit (see note
//   below); upgrade to Vercel KV or Upstash Redis when abuse becomes real
// - Bot user-agent rejection — the same heuristic we use for github-releases

import { isReasoningModel, resolveModel, sanitizeMessage } from './model';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_DIFF_BYTES = 100_000;
// Completion budgets. A reasoning model bills its thinking against the same
// budget even when we ask for `reasoning_format: hidden`, so a budget sized
// for a plain instruction model (180 / 400, which is what shipped) leaves
// nothing for the answer: the reply comes back empty or cut off mid-thought,
// and the app reports a provider failure. Sized to leave room for both.
const MAX_TOKENS_SHORT = 1500;
const MAX_TOKENS_LONG = 2500;
// Deadline on the upstream call. The app gives up after 30 s, so answering
// before that keeps the failure ours to describe -- a stalled Groq connection
// otherwise surfaces as a bare client-side network error with nothing in our
// logs to say what happened.
const UPSTREAM_TIMEOUT_MS = 25_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 30;

// Best-effort in-memory rate limit. Vercel serverless runs this map per
// lambda instance, so the actual cap on a hot region can be 30·N where N is
// the number of warm instances — still well under Groq's free tier and good
// enough to deter casual abuse. For a hard cap, swap this for Vercel KV.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

type Tone = 'professional' | 'casual' | 'friendly';
type Length = 'short' | 'normal' | 'long';

interface AICommitConfig {
  conventional: boolean;
  emoji: boolean;
  tone: Tone;
  length: Length;
  customInstructions: string;
}

// Cap on free-form custom instructions to keep token spend bounded and
// reduce the surface for prompt-injection abuse. Real-world house-style
// rules fit comfortably in well under this.
const MAX_CUSTOM_INSTRUCTIONS = 2000;

interface AICommitRequest {
  diff: string;
  config: AICommitConfig;
}

const TONES: ReadonlySet<Tone> = new Set(['professional', 'casual', 'friendly']);
const LENGTHS: ReadonlySet<Length> = new Set(['short', 'normal', 'long']);

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function clientIP(request: Request): string {
  // Vercel sets x-forwarded-for; fall back to a sentinel so unknown clients
  // share a single bucket rather than each getting their own free 30/hour.
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

function lengthDescription(length: Length): string {
  switch (length) {
    case 'short':
      return 'one line, under 60 characters';
    case 'normal':
      return 'one line under 72 characters, optionally followed by a single short paragraph of body';
    case 'long':
      // Bullet-list body is the de-facto OSS convention (Linux kernel,
      // major projects on GitHub) — easier to scan than prose paragraphs
      // and matches what reviewers expect in PR descriptions too.
      return [
        'subject line, then a blank line, then a bulleted body.',
        "Each bullet starts with '- ' and is one complete sentence describing a single change and its motivation.",
        'Example of the desired shape:',
        '',
        '    chore: bump dependencies',
        '',
        '    - Update Mantine packages to 9.1.1 for improved compatibility and bug fixes.',
        '    - Upgrade Storybook to 10.3.6 to include the latest UI enhancements.',
        '    - Bump oxlint, postcss, and rollup to newer patch releases for stability.',
      ].join('\n');
  }
}

function buildSystemPrompt(config: AICommitConfig): string {
  const lines: string[] = [
    'You are a Git commit message generator. Given a git diff, produce a single commit message.',
    'Rules:',
    '- Use imperative mood (e.g., "add feature" not "added feature")',
    config.conventional
      ? '- Follow Conventional Commits format: type(scope): subject — types include feat, fix, refactor, chore, docs, test, style, perf'
      : '- Do not prefix with a Conventional Commits type',
    config.emoji ? '- Start the subject with one relevant emoji' : '- Do not include emojis',
    `- Tone: ${config.tone}`,
    `- Length: ${lengthDescription(config.length)}`,
    '- Focus on WHY the change was made, not WHAT changed line by line',
    '- Never include code from the diff in the message',
    '- Respond with ONLY the commit message, no surrounding quotes, no explanations, no preamble.',
  ];

  // Custom instructions are appended as a separate authoritative block so
  // the model treats them as personal house style. They override the
  // defaults if they conflict (the model is told so explicitly), which is
  // what the user expects: "I told you to never use 'leverage'" should
  // beat the generic 'professional tone' rule.
  const custom = (config.customInstructions ?? '').trim();
  if (custom.length > 0) {
    lines.push(
      '',
      'Additional user instructions (treat as authoritative; override the defaults above if they conflict):',
      custom
    );
  }

  return lines.join('\n');
}

function parseConfig(raw: unknown): AICommitConfig {
  const r = (raw ?? {}) as Partial<AICommitConfig>;
  const tone = (r.tone && TONES.has(r.tone as Tone) ? r.tone : 'professional') as Tone;
  const length = (r.length && LENGTHS.has(r.length as Length) ? r.length : 'short') as Length;
  let customInstructions = typeof r.customInstructions === 'string' ? r.customInstructions : '';
  if (customInstructions.length > MAX_CUSTOM_INSTRUCTIONS) {
    customInstructions = customInstructions.slice(0, MAX_CUSTOM_INSTRUCTIONS);
  }
  return {
    conventional: typeof r.conventional === 'boolean' ? r.conventional : true,
    emoji: typeof r.emoji === 'boolean' ? r.emoji : false,
    tone,
    length,
    customInstructions,
  };
}

export async function POST(request: Request): Promise<Response> {
  // Bot rejection — same heuristic as the github-releases proxy. Doesn't
  // help against motivated attackers, but stops dumb crawlers from burning
  // through Groq quota.
  const ua = request.headers.get('user-agent');
  if (!ua) {
    return Response.json({ error: 'User agent required' }, { status: 400 });
  }
  if (/bot|crawl|slurp|spider/i.test(ua)) {
    return Response.json({ error: 'Bots are not allowed' }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    // Fail loud in logs but soft for the client — surface a generic error so
    // we don't leak the misconfiguration.
    // eslint-disable-next-line no-console
    console.error('GROQ_API_KEY is not set on Vercel');
    return Response.json({ error: 'AI provider not configured' }, { status: 503 });
  }

  const ip = clientIP(request);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return Response.json(
      { error: 'Rate limit exceeded', retryAfter: limit.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  let body: AICommitRequest;
  try {
    body = (await request.json()) as AICommitRequest;
  } catch {
    return badRequest('Invalid JSON body');
  }

  if (typeof body.diff !== 'string' || body.diff.trim().length === 0) {
    return badRequest('`diff` is required');
  }

  // Byte length, not char length — multi-byte characters in long diffs
  // shouldn't sneak past the 50 KB cap.
  const diffBytes = new TextEncoder().encode(body.diff).byteLength;
  if (diffBytes > MAX_DIFF_BYTES) {
    return Response.json(
      {
        error: `Diff too large (max ${MAX_DIFF_BYTES / 1000} KB, received ${Math.round(diffBytes / 1000)} KB)`,
      },
      { status: 413 }
    );
  }

  const config = parseConfig(body.config);
  const systemPrompt = buildSystemPrompt(config);
  const model = resolveModel();

  let groqResponse: Response;
  try {
    groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: body.diff },
        ],
        temperature: 0.3,
        max_completion_tokens: config.length === 'long' ? MAX_TOKENS_LONG : MAX_TOKENS_SHORT,
        // Ask for the answer only. Groq's default `reasoning_format` is
        // `raw`, which wraps the chain of thought in `<think>` tags inside
        // `message.content` -- i.e. straight into the user's commit message.
        ...(isReasoningModel(model) ? { reasoning_format: 'hidden' } : {}),
      }),
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Groq fetch failed:', error);
    return Response.json({ error: 'Upstream provider unreachable' }, { status: 502 });
  }

  if (!groqResponse.ok) {
    const text = await groqResponse.text().catch(() => '');
    // eslint-disable-next-line no-console
    console.error('Groq returned non-2xx:', model, groqResponse.status, text);

    // A 4xx from Groq means OUR request is wrong -- a decommissioned model, a
    // revoked key, an unsupported parameter -- and no amount of retrying will
    // fix it. Reporting that as 502 is what let a dead model masquerade as a
    // passing outage for eight days (FinderGit#154), so it gets its own status
    // and a machine-readable code the client can act on.
    if (groqResponse.status >= 400 && groqResponse.status < 500) {
      return Response.json(
        {
          error: 'The AI service is misconfigured and needs an update. Please report this.',
          code: 'upstream_request_rejected',
          status: groqResponse.status,
        },
        { status: 424 }
      );
    }

    return Response.json(
      { error: 'Upstream provider error', code: 'upstream_error', status: groqResponse.status },
      { status: 502 }
    );
  }

  let groqJson: any;
  try {
    groqJson = await groqResponse.json();
  } catch {
    return Response.json({ error: 'Invalid upstream response' }, { status: 502 });
  }

  const message: unknown = groqJson?.choices?.[0]?.message?.content;
  if (typeof message !== 'string') {
    return Response.json({ error: 'Empty response from provider' }, { status: 502 });
  }

  // The app displays this verbatim in the commit field, so the emptiness check
  // belongs AFTER the cleanup: an answer that is nothing but a code fence, or
  // nothing but truncated reasoning, must be reported as a failure rather than
  // pasted into a commit.
  const cleaned = sanitizeMessage(message);
  if (cleaned.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      'Nothing usable in the provider response:',
      model,
      JSON.stringify(message.slice(0, 300))
    );
    return Response.json({ error: 'Empty response from provider' }, { status: 502 });
  }

  return Response.json({ message: cleaned });
}
