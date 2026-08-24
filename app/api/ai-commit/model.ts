// Model selection and output sanitising for the AI commit-message proxy.
//
// Split out of route.ts because these three rules decide what the user ends
// up with in the commit field, and they are the parts worth unit-testing:
// which model we ask for, whether that model needs a `reasoning_format`, and
// what has to be stripped from its answer before we hand it back.

// Groq decommissioned `llama-3.3-70b-versatile` on 2026-08-16 -- the model
// this proxy had hardcoded since it shipped. Groq answered 404 to every
// request and the app reported "provider temporarily unreachable" for eight
// days (FinderGit#154). `openai/gpt-oss-120b` is Groq's own recommended
// replacement for it.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

/// The model to ask Groq for. `GROQ_MODEL` on Vercel overrides the default,
/// so the next decommission is a dashboard edit plus a redeploy rather than a
/// code change, a review and a release.
export function resolveModel(configured: string | undefined = process.env.GROQ_MODEL): string {
  const trimmed = configured?.trim();
  return trimmed ? trimmed : DEFAULT_MODEL;
}

// Reasoning models on Groq accept `reasoning_format`; the plain instruction
// models reject it with a 400. Since `GROQ_MODEL` can point anywhere, decide
// from the model id rather than assuming the default is still in place --
// otherwise switching to a Llama-style model via the env var would break the
// endpoint in a new way.
const REASONING_MODEL_PATTERN = /gpt-oss|qwen3|deepseek-r1|magistral|kimi/i;

export function isReasoningModel(model: string): boolean {
  return REASONING_MODEL_PATTERN.test(model);
}

// `reasoning_effort` is not one parameter across families: Groq accepts
// low/medium/high for GPT-OSS and only none/default for Qwen 3.6. Sending
// `low` to a Qwen model is a rejected request, which would break the
// GROQ_MODEL override at the exact moment it is needed -- Qwen being the other
// replacement Groq recommends for the model that was switched off.
const EFFORT_CAPABLE_PATTERN = /gpt-oss/i;

/// Reasoning parameters to merge into the upstream request for this model.
///
/// `reasoning_format: 'hidden'` for every reasoning family, because the
/// default (`raw`) puts the chain of thought inside `message.content`.
/// `reasoning_effort` only where its values are the ones Groq accepts.
export function reasoningOptions(model: string): Record<string, string> {
  if (!isReasoningModel(model)) {
    return {};
  }
  if (EFFORT_CAPABLE_PATTERN.test(model)) {
    // Summarising a diff is not a puzzle, and every reasoning token is billed
    // against both our completion budget and the key's per-minute allowance.
    return { reasoning_format: 'hidden', reasoning_effort: 'low' };
  }
  return { reasoning_format: 'hidden' };
}

/// Cleans up the model's answer before it reaches the commit field.
///
/// Returns an empty string when nothing usable survives, which the caller
/// must treat as a provider failure -- never as a commit message.
export function sanitizeMessage(raw: string): string {
  let text = raw.trim();

  // Reasoning models emit their chain of thought in `<think>` tags inside
  // `message.content` whenever `reasoning_format` is `raw`, which is Groq's
  // default. We ask for `hidden`, so this is belt-and-braces: if the request
  // ever goes out without the parameter (an env var pointing at a model our
  // pattern above doesn't recognise, a Groq default change), the thinking
  // must not land in the user's commit message.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // An unterminated `<think>` means the model spent its whole completion
  // budget thinking and got cut off mid-thought. Everything after the tag is
  // truncated reasoning, so there is no message here at all.
  const unterminated = text.search(/<think>/i);
  if (unterminated !== -1) {
    text = text.slice(0, unterminated).trim();
  }

  // Code fences and surrounding quotes the model sometimes adds despite being
  // told not to. The opening fence is matched to the end of its line rather
  // than by info-string alphabet: ```commit-message is a legal fence, and an
  // alphabetic-only match would leave "-message" heading the commit message.
  return text
    .replace(/^```[^\r\n]*(?:\r?\n|$)/, '')
    .replace(/```$/, '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}
