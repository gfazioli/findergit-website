import { isReasoningModel, reasoningOptions, resolveModel, sanitizeMessage } from './model';

// These are the rules that decide what lands in the user's commit field. The
// `<think>` cases are the ones with teeth: with the tag-stripping removed,
// they return the model's chain of thought as the commit message.
describe('resolveModel', () => {
  it('falls back to the default when GROQ_MODEL is unset, empty or whitespace', () => {
    expect(resolveModel(undefined)).toBe('openai/gpt-oss-120b');
    expect(resolveModel('')).toBe('openai/gpt-oss-120b');
    expect(resolveModel('   ')).toBe('openai/gpt-oss-120b');
  });

  it('honours GROQ_MODEL so a decommission can be worked around from Vercel', () => {
    expect(resolveModel('qwen/qwen3.6-27b')).toBe('qwen/qwen3.6-27b');
    expect(resolveModel('  openai/gpt-oss-20b  ')).toBe('openai/gpt-oss-20b');
  });
});

describe('isReasoningModel', () => {
  it('recognises the reasoning families Groq accepts reasoning_format for', () => {
    expect(isReasoningModel('openai/gpt-oss-120b')).toBe(true);
    expect(isReasoningModel('openai/gpt-oss-20b')).toBe(true);
    expect(isReasoningModel('qwen/qwen3.6-27b')).toBe(true);
  });

  it('leaves plain instruction models alone, since they 400 on the parameter', () => {
    expect(isReasoningModel('llama-3.1-8b-instant')).toBe(false);
    expect(isReasoningModel('llama-3.3-70b-versatile')).toBe(false);
  });
});

describe('reasoningOptions', () => {
  it('sends low effort only to the GPT-OSS family, which accepts those values', () => {
    expect(reasoningOptions('openai/gpt-oss-120b')).toEqual({
      reasoning_format: 'hidden',
      reasoning_effort: 'low',
    });
    expect(reasoningOptions('openai/gpt-oss-20b')).toEqual({
      reasoning_format: 'hidden',
      reasoning_effort: 'low',
    });
  });

  it('omits the effort for other reasoning families, which reject low', () => {
    // Groq accepts only none/default for Qwen 3.6, and Qwen is the other
    // replacement it recommends -- so sending `low` would break the GROQ_MODEL
    // override exactly when it is being used to escape a dead model.
    expect(reasoningOptions('qwen/qwen3.6-27b')).toEqual({ reasoning_format: 'hidden' });
    expect(reasoningOptions('deepseek-r1-distill-llama-70b')).toEqual({
      reasoning_format: 'hidden',
    });
  });

  it('sends nothing at all for a plain instruction model', () => {
    expect(reasoningOptions('llama-3.1-8b-instant')).toEqual({});
  });
});

describe('sanitizeMessage', () => {
  it('drops a reasoning block and keeps the commit message after it', () => {
    const raw =
      '<think>\nThe diff adds a README line, so this is docs.\n</think>\ndocs: mention the new flag';
    expect(sanitizeMessage(raw)).toBe('docs: mention the new flag');
  });

  it('returns nothing when the answer is reasoning cut off mid-thought', () => {
    // The completion budget ran out inside the `<think>` block, so there is no
    // message at all -- the caller must report a provider failure rather than
    // paste half a thought into a commit.
    expect(sanitizeMessage('<think>Let me look at what changed here and')).toBe('');
  });

  it('returns nothing when reasoning is all there was', () => {
    expect(sanitizeMessage('<think>done thinking</think>')).toBe('');
  });

  it('keeps a bulleted body intact', () => {
    const raw =
      'chore: bump dependencies\n\n- Update Mantine to 9.1.1.\n- Upgrade Storybook to 10.3.6.';
    expect(sanitizeMessage(raw)).toBe(raw);
  });

  it('strips an opening fence whatever its info string', () => {
    // ```commit-message is a legal fence, and an alphabetic-only match stops at
    // the hyphen -- leaving "-message" at the head of the commit message.
    expect(sanitizeMessage('```commit-message\nfeat: add thing\n```')).toBe('feat: add thing');
    expect(sanitizeMessage('```\nfeat: add thing\n```')).toBe('feat: add thing');
  });

  it('still strips code fences and surrounding quotes', () => {
    expect(sanitizeMessage('```text\nfeat: add thing\n```')).toBe('feat: add thing');
    expect(sanitizeMessage('"fix: guard the nil case"')).toBe('fix: guard the nil case');
  });
});
