# Card Verification

Verify through the Card definition and user-visible flow:

1. Resolver returns the expected success payload from representative source data.
2. A legitimate no-record result returns `status: "empty"`.
3. An upstream or validation failure becomes the sanitized `CARD_QUERY_FAILED` response.
4. The Card library lists the new Card and adding it uses a valid first-fit layout.
5. The Dashboard seed is unchanged unless the request explicitly included it.
6. Typecheck, lint, and the relevant consumer tests pass.
7. A real Card data HTTP request succeeds for the authenticated owner and fails safely for another user.
8. In a browser, add the Card, inspect its labels/formatting, resize it, reload, and verify optional source data.

Run the inspector after editing to catch broken manifest paths or mismatched Gridframe package majors. If browser or live-data verification cannot run, name that gap explicitly.
