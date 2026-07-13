# Legacy Integration Adoption

When `gridframe.json` is absent, search for `createDashboardHandlers`, `CardLibraryTemplate`, `defaultDashboard`, `resolveCardData`, `PanelDashboard`, and route imports.

Before editing, show the discovered Card library, resolver, seed, handlers, repository, Dashboard component, and route mounts. Require the developer to confirm that mapping before migrating, even when discovery found only one candidate.

Migrate only the Card boundary:

1. Confirm that the installed `@gridframe/server` 1.x package exports `defineCards`, then import it and convert the existing library entries into a keyed registry.
2. Move each resolver branch beside its matching definition without changing data access or response behavior.
3. Replace the old library and resolver arguments with `cards.cardLibrary` and `cards.resolveCardData`.
4. Replace every seed literal that refers to a migrated Card key with `cards.definitions[key].key`.
5. Preserve repository, routes, authentication, API paths, Card keys, layouts, and persisted data.
6. Run the existing suite before adding the new Card.
7. Create `gridframe.json` only after every mapped path is known and tests pass.

Do not combine adoption with unrelated framework, database, or directory restructuring.
