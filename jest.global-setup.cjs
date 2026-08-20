// The test suite runs in a zone that is AHEAD of UTC, on purpose.
//
// Date bugs hide in a zone whose offset happens to agree with UTC for the
// timestamps under test: Europe/Rome (UTC+2 in summer) renders a 16:40 UTC
// publication on its own calendar date, so a formatter that forgot to pin a
// zone still looked correct. Pacific/Auckland (UTC+12/+13) does not agree, and
// the release-date tests fail without the pin.
//
// It has to be set here rather than in a `beforeAll`: by the time a test body
// runs, the worker has already initialised ICU and re-reading process.env.TZ
// has no effect on Intl (measured — resolvedOptions() kept reporting the
// original zone). Workers inherit this env when they are forked.
module.exports = async () => {
  process.env.TZ = 'Pacific/Auckland';
};
