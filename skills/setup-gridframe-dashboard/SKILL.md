---
name: setup-gridframe-dashboard
description: Set up a consumer application's first API-managed Gridframe Dashboard using its existing framework, authentication, and database. Use when installing Gridframe, creating Dashboard handlers or persistence for the first time, defining the initial Dashboard seed and Card library, or completing a partially wired server-backed Gridframe integration.
---

# Setup Gridframe Dashboard

Build the complete first vertical slice: durable Dashboard state, authenticated handlers, a Card definition backed by real application data, and the rendered Dashboard.

## 1. Inspect before editing

Run `node scripts/inspect-project.mjs <application-root>` from this skill directory. Read the reported package versions, framework, auth, database, migrations, tests, and existing Gridframe files. Then read:

- [contracts.md](references/contracts.md) for the manifest, `defineCards`, seed, and handler contracts.
- [persistence-and-auth.md](references/persistence-and-auth.md) before changing persistence or routes.
- The relevant section of [frameworks.md](references/frameworks.md) before mounting handlers.

Require `@gridframe/server` 1.1.0 or newer within Gridframe 1.x, and use the installed type declarations as the final source of truth. Preserve the application's package manager, file layout, database library, migration style, auth boundary, and test conventions.

If durable persistence or authenticated identity has no established choice, stop and ask the developer. Do not silently introduce an in-memory repository or trust a route `userId`.

If the application has no React client surface, stop and ask where Gridframe's React Dashboard should live. Do not assume a server framework also provides a compatible client.

## 2. Implement one working slice

1. Install matching-major Gridframe packages, with `@gridframe/server` at 1.1.0 or newer.
2. Implement `DashboardRepository` with the existing database. Keep mutations transactional and enforce revision changes atomically.
3. Create a `defineCards` registry with one real Card. Resolve data from an existing application service or database and return a valid `PanelCardDataResponse`.
4. Create one Dashboard seed containing that Card via `cards.definitions.<key>.key`.
5. Pass `cards.cardLibrary` and `cards.resolveCardData` to `createDashboardHandlers`.
6. Mount every handler using the framework's native Request/Response bridge. Derive authenticated identity on the server and verify any URL identity matches it.
7. Render `PanelDashboard`, import `@gridframe/react/styles.css`, and use the mounted API base path.
8. Write `gridframe.json` beside the integrated application using the contract in [contracts.md](references/contracts.md).

Do not add a separate consumer HTTP API merely to satisfy an example. A Card resolver may query a database, call an internal service, or fetch an authenticated upstream API directly.

## 3. Verify the whole path

Follow [verification.md](references/verification.md). Require repository tests, handler tests, Card resolver tests, the application's typecheck/tests, real HTTP requests, and browser verification when a dev server can run. Exercise bootstrap twice to prove idempotence and exercise a mutation to prove revision conflict handling.

Run `node scripts/validate-gridframe.mjs <application-root>` after editing. Report any runtime surface that could not be verified; never describe code-only checks as end-to-end success.
