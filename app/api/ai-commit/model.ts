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
/// Returns an empty string when nothing usable survives, which the caller must
/// treat as a provider failure -- never as a commit message. That includes
/// anything still carrying a reasoning marker after the passes below: a commit
/// message the user has to notice and undo is worse than an error they can
/// retry, so this refuses rather than guesses.
export function sanitizeMessage(raw: string): string {
  let text = raw.trim();

  // Reasoning arrives in `message.content` whenever `reasoning_format` is
  // `raw`, which is Groq's default. We ask for `hidden`, so everything here is
  // belt-and-braces for the day that request goes out without the parameter --
  // a GROQ_MODEL the family check does not recognise, a provider default
  // change -- because the cost of being wrong is the model's private thinking
  // in a public commit.

  // Matched pairs first.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // A closing tag with no opening one: the opening was truncated in transit or
  // never emitted (some providers only send the close). Everything before it is
  // reasoning, so keep what follows the last one.
  const CLOSE = '</think>';
  const lastClose = text.toLowerCase().lastIndexOf(CLOSE);
  if (lastClose !== -1) {
    text = text.slice(lastClose + CLOSE.length).trim();
  }

  // GPT-OSS -- the family this endpoint now defaults to -- does not use
  // `<think>` at all: its native format is Harmony channels, where the answer
  // is the `final` channel and the thinking is `analysis`. Take the final
  // channel when it is there; when only other channels are present there is no
  // way to tell answer from thinking, so leave the markers in place and let the
  // refusal below catch it.
  if (/<\|channel\|>/i.test(text)) {
    const final = text.match(
      /<\|channel\|>final<\|message\|>([\s\S]*?)(?:<\|return\|>|<\|end\|>|$)/i
    );
    if (final) {
      text = final[1].trim();
    }
  }

  // Code fences and surrounding quotes the model sometimes adds despite being
  // told not to. The opening fence is matched to the end of its line rather
  // than by info-string alphabet: ```commit-message is a legal fence, and an
  // alphabetic-only match would leave "-message" heading the commit message.
  const cleaned = text
    .replace(/^```[^\r\n]*(?:\r?\n|$)/, '')
    .replace(/```$/, '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();

  // Still a marker in there? Either the model spent its whole budget thinking
  // and got cut off mid-thought, or the answer is in a shape we do not
  // recognise. Refuse. This also refuses the rare legitimate message that
  // mentions a marker literally -- the trade is deliberate: that costs one
  // retry, while guessing costs a commit with reasoning in it.
  if (/<think|<\|/i.test(cleaned)) {
    return '';
  }

  return cleaned;
}
