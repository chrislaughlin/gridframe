# Setup Verification

Run the consumer's existing checks and add tests at public boundaries:

1. Repository: idempotent bootstrap, owner isolation, transactional mutations, stale revision rejection, and missing Dashboard behavior.
2. Card definition: success payload, legitimate empty data, invalid/upstream failure, and owner scoping.
3. Handlers: all route adapters, authenticated identity mismatch, Card library addition, layout mutation, and sanitized Card query failure.
4. Manifest: run `validate-gridframe.mjs`; every mapped path must exist and Gridframe package majors must match.
5. HTTP: issue real requests to bootstrap, library, add/remove, layout, and Card data endpoints.
6. Browser: render the Dashboard, add the Card, drag/resize it, reload to prove persistence, and open any configured drill-down.

Bootstrap twice and assert the same default Dashboard is returned. Send one mutation with a stale revision and assert a 409 conflict. Test an authenticated user against another user's URL.

If a dev server or live dependency is unavailable, complete all remaining checks and state exactly which runtime behavior remains unverified.
