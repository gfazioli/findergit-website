import { act, renderHook, waitFor } from '@testing-library/react';
import { useReleaseNotes, type Release } from './use-release-notes';

// The runtime fallback when the compiler's chunk DOES load. `mockLoaded` counts the
// loads: the module factory runs when the hook first imports it.
const mockLoaded = jest.fn();
jest.mock('./load-releases', () => {
  mockLoaded();
  return {
    compileReleaseBodies: async (releases: Release[]) =>
      releases.map((r) => ({ ...r, rawBody: r.body ?? '', body: `compiled:${r.body ?? ''}` })),
  };
});

// Wrapped in a function because `jest.mock` is hoisted above the `const`.
const mockUseSWR = jest.fn();
jest.mock('swr', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
}));

function release(id: number, tag: string, body: string): Release {
  return {
    id,
    tag_name: tag,
    name: `App ${tag.slice(1)}`,
    body,
    created_at: '2026-09-29T12:43:33Z',
    published_at: '2026-09-29T12:43:33Z',
  } as unknown as Release;
}

describe('useReleaseNotes, with nothing from the build', () => {
  // First, while the module has not been imported yet.
  it('does not load the compiler to compile an empty list', async () => {
    mockUseSWR.mockReturnValue({ data: { releases: [] }, error: undefined, isLoading: false });
    const { result } = renderHook(() => useReleaseNotes([]));
    // Past the microtask a dynamic import would resolve in, and a macrotask on top.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.data).toEqual([]);
    expect(mockLoaded).not.toHaveBeenCalled();
  });

  it('shows the releases compiled when the compiler loads', async () => {
    mockUseSWR.mockReturnValue({
      data: { releases: [release(1, 'v0.40.0', 'hello')] },
      error: undefined,
      isLoading: false,
    });
    const { result } = renderHook(() => useReleaseNotes([]));
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data[0].body).toBe('compiled:hello');
    expect(mockLoaded).toHaveBeenCalledTimes(1);
  });
});
