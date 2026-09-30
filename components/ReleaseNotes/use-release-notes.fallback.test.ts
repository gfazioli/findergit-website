import { renderHook, waitFor } from '@testing-library/react';
import { useReleaseNotes, type Release } from './use-release-notes';

// The runtime fallback, when the compiler's chunk will not load. Under Jest the
// hook's `import('./load-releases')` is a `require`, so a factory that throws is
// that chunk failing: the case a static import could never reach.
jest.mock('./load-releases', () => {
  throw new Error('ChunkLoadError: Loading chunk failed.');
});

// The hook reads the API through SWR. Called lazily, so the factory does not
// touch `mockUseSWR` before the test has given it an answer.
const mockUseSWR = jest.fn();
jest.mock('swr', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
}));

function release(tag: string, body: string | null, publishedAt: string): Release {
  return {
    id: tag.length,
    tag_name: tag,
    name: `App ${tag.slice(1)}`,
    body,
    created_at: publishedAt,
    published_at: publishedAt,
  } as unknown as Release;
}

describe('useReleaseNotes, with nothing from the build', () => {
  it('shows the fetched releases as plain text when the compiler will not load', async () => {
    const fetched = [
      release('v0.40.0', '- **Account.** Your GitHub profile, in the app.', '2026-09-29T09:39:06Z'),
      release('v0.39.0', null, '2026-09-27T12:36:56Z'),
    ];
    mockUseSWR.mockReturnValue({ data: { releases: fetched }, error: undefined, isLoading: false });

    const { result } = renderHook(() => useReleaseNotes([]));

    // Before the fix the list stayed empty, so the page stayed on its "Loading
    // releases..." skeleton over two releases it had just fetched.
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data.map((r) => r.tag_name)).toEqual(['v0.40.0', 'v0.39.0']);
    expect(result.current.data[0].body).toBeNull();
    expect(result.current.data[0].rawBody).toBe('- **Account.** Your GitHub profile, in the app.');
    expect(result.current.data[0].displayDate).toBe('September 29, 2026');
    expect(result.current.data[1].rawBody).toBe('');
    expect(result.current.error).toBeFalsy();
  });
});
