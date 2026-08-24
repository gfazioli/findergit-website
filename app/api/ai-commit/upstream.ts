// How to read a failed response from the AI provider.
//
// Its own file because getting this wrong is the whole history of this
// endpoint: for eight days a decommissioned model was reported as a passing
// outage (FinderGit#154), and the fix for that immediately reported a spent
// rate limit as a broken service. Both were one-line decisions buried in a
// request handler with no test. Here they are a function with a test.

export type UpstreamFailure =
  /// Transient by definition: the allowance refills. Pass it to the client as a
  /// 429 so the app can say how long to wait.
  | 'rate_limited'
  /// The provider rejected the request WE built -- decommissioned model, bad
  /// key, unsupported parameter. Retrying cannot help; the service needs a fix.
  | 'request_rejected'
  /// The provider itself is unwell (5xx), or the status makes no sense. Worth
  /// retrying.
  | 'provider_error';

export function classifyUpstreamFailure(status: number): UpstreamFailure {
  if (status === 429) {
    return 'rate_limited';
  }
  if (status >= 400 && status < 500) {
    return 'request_rejected';
  }
  return 'provider_error';
}
