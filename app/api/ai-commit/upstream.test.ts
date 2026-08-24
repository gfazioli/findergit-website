import { classifyUpstreamFailure } from './upstream';

// This function exists because both of its wrong answers have already shipped:
// a decommissioned model read as a transient outage, then a spent rate limit
// read as a broken service.
describe('classifyUpstreamFailure', () => {
  it('treats 429 as transient, not as a broken request', () => {
    expect(classifyUpstreamFailure(429)).toBe('rate_limited');
  });

  it('treats every other 4xx as our request being wrong', () => {
    for (const status of [400, 401, 403, 404, 413, 422]) {
      expect(classifyUpstreamFailure(status)).toBe('request_rejected');
    }
  });

  it('treats 5xx as the provider being unwell', () => {
    for (const status of [500, 502, 503, 504]) {
      expect(classifyUpstreamFailure(status)).toBe('provider_error');
    }
  });

  it('falls back to provider_error for a status that makes no sense', () => {
    expect(classifyUpstreamFailure(0)).toBe('provider_error');
    expect(classifyUpstreamFailure(999)).toBe('provider_error');
  });
});
