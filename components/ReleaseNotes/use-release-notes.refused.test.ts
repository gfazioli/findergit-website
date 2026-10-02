import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useReleaseNotes, type Release } from './use-release-notes';

// The runtime fallback through the REAL SWR and the hook's own fetcher, which is
// what the browser does when the build could not reach GitHub. Every other test
// of the hook mocks SWR and feeds it a successful shape, and that is how a
// refused answer read as a list with no releases for as long as it did (#68).

const RATE_LIMIT = 'Rate limit exceeded. Please try again later.';

// The compiler is not what these tests are about: a list comes back as it went in.
jest.mock('./load-releases', () => ({
  compileReleaseBodies: async (releases: unknown[]) => releases,
}));

function answer(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

// A cache of its own for each test, and SWR's retry as fast as it goes: a hook
// that still retried would call `fetch` again well inside the wait below.
function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    {
      value: {
        provider: () => new Map(),
        errorRetryInterval: 1,
        dedupingInterval: 0,
        focusThrottleInterval: 0,
      },
    },
    children
  );
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('useReleaseNotes, when the releases route refuses', () => {
  it('says a 429 is a rate limit, and asks only once', async () => {
    fetchMock.mockResolvedValue(answer(429, { error: 'Too Many Requests' }));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(RATE_LIMIT));

    await act(() => pause(100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // A 403 is the route's bot filter or GitHub refusing for another reason: the
  // route sends a spent quota on as a 429 (see its test).
  it.each([403, 500])('names any other status, %i included', async (status) => {
    fetchMock.mockResolvedValue(answer(status, { error: 'Refused' }));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() =>
      expect(result.current.error).toBe(
        `The server answered HTTP ${status}. Please try again later.`
      )
    );
  });

  // The Alert renders the error as a child, and an Error object there throws.
  it('says a request that never got an answer as a string', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() =>
      expect(result.current.error).toBe(
        'The release notes could not be reached. Please try again later.'
      )
    );
  });

  it('reads an answer that is not refused as the releases', async () => {
    fetchMock.mockResolvedValue(answer(200, { releases: [], status: 'ok' }));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([]);
  });

  it('says a refused revalidation when it had no release to show', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { releases: [], status: 'ok' }))
      .mockResolvedValue(answer(429, { error: 'Too Many Requests' }));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await pause(50);
    });
    await waitFor(() => expect(result.current.error).toBe(RATE_LIMIT));
  });

  it('keeps what it showed when asking again on focus is refused', async () => {
    const shown = { id: 1, tag_name: 'v1.0.0', body: 'Notes.' } as unknown as Release;
    fetchMock
      .mockResolvedValueOnce(answer(200, { releases: [shown], status: 'ok' }))
      .mockResolvedValue(answer(429, { error: 'Too Many Requests' }));

    const { result } = renderHook(() => useReleaseNotes([]), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await pause(50);
    });
    // It did ask again, and was refused...
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // ...and the page keeps the release it showed rather than trading it for an error.
    expect(result.current.error).toBeNull();
    expect(result.current.data.map((r) => r.tag_name)).toEqual(['v1.0.0']);
  });
});
