# Persistence and Authentication

## Repository invariants

- Scope every read and mutation by the authenticated owner ID and Dashboard ID.
- Bootstrap idempotently. Concurrent first requests must not create two default Dashboards.
- Store Dashboard revision as an integer. Increment it once per successful mutation.
- Make revision checks atomic in the write statement or transaction. Throw `DashboardRevisionConflictError` when zero rows match the expected revision.
- Wrap bootstrap, complete layout replacement, Card addition, and Card removal in transactions when they touch multiple records.
- Preserve Card order and validate the complete layout before persisting it.
- Translate missing owned records to `DashboardNotFoundError`; never leak another user's Dashboard existence.
- Run schema changes through the application's established migration system.

Implement every current `DashboardRepository` method from the installed declaration. Do not copy an interface from online documentation when the installed package differs.

## Authentication boundary

Resolve the session or access token before calling a Gridframe handler. Use the server-derived subject as `userId`. If the route also contains `userId`, require equality and return the application's normal unauthorized/not-found response on mismatch.

If the application has no established mismatch response, return 404 so the route does not reveal another user's Dashboard.

Do not accept client headers such as `x-user-id` as identity unless an already trusted gateway creates and authenticates them. Preserve the application's existing CSRF, cookie, and API authorization conventions.

Card resolvers receive the verified identity through `CardDataResolverInput`. Apply the same tenant and owner scopes used elsewhere in the application.
