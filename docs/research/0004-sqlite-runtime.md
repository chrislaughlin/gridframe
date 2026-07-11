# SQLite runtime for the Next.js example

Status: recommended

Researched: 2026-07-11

Issue: [gridframe#4](https://github.com/chrislaughlin/gridframe/issues/4)

## Recommendation

Use `better-sqlite3` directly in `apps/web`, behind a small Dashboard repository interface. Use a file-backed database for local development and an isolated in-memory database for repository tests. Manage the schema with numbered, version-controlled SQL migrations.

Do not add a database dependency to `@gridframe/core`, `@gridframe/client`, or `@gridframe/react`. Those packages should expose transport and component contracts without knowing how the example application persists them.

Reconsider the built-in `node:sqlite` module after Gridframe deliberately raises its Node.js baseline and the module reaches stable status. Do not use the deprecated `sqlite3` package. Defer Drizzle and libSQL until schema complexity or a remote deployment requirement justifies them.

## Repository fit

The repository declares Node.js `>=18`, while its example applications use Next.js 16.2. Next.js 16 requires Node.js 20.9 or later, according to the [official Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) (updated 2026-03-25). The root engine declaration already needs a separate correction to `>=20.9`.

That correction would still not make `node:sqlite` generally available. Node added the module in 22.5, removed its experimental flag in 22.13/23.4, and describes it as Stability 1.2, “release candidate,” as of the [Node.js 24 documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html). Selecting it now would require raising the repository baseline beyond Next.js's requirement while adopting a pre-stable API.

`better-sqlite3` works with currently supported Node.js versions and supplies prebuilt binaries for LTS releases. Its synchronous prepared-statement and transaction APIs match the small, local, transactional workload agreed in issues #2 and #3: atomically bootstrap a Dashboard, verify ownership and revision, update rows, and return the resulting aggregate. It supports both file paths and `:memory:` databases; see its [README](https://github.com/WiseLibs/better-sqlite3) and [API documentation](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md).

The native addon is also a known Next.js integration. Next.js includes `better-sqlite3` in its [automatic `serverExternalPackages` list](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) (updated 2026-02-27), so Route Handlers can load it through the Node.js runtime without bundling the native binary into the server bundle.

## Options compared

| Option                       | Advantages                                                                                                                                        | Disadvantages                                                                                                                                                                          | Decision                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `better-sqlite3`             | Mature, compact synchronous API; prepared statements and transactions; file and memory databases; supported explicitly by Next.js externalization | Native addon and platform prebuilds; upgrades may change the bundled SQLite version; unsuitable for Edge runtimes                                                                      | Use for the v1 example                                                   |
| `node:sqlite`                | No npm or third-party native dependency; synchronous API; file and memory databases                                                               | Requires Node.js 22.5+ and remains release-candidate stability; conflicts with the current engine contract                                                                             | Reassess after a deliberate Node baseline increase and API stabilization |
| `sqlite3` / `node-sqlite3`   | Asynchronous API; established package name                                                                                                        | Its [official repository](https://github.com/TryGhost/node-sqlite3) now labels it deprecated and unmaintained; callback-oriented API adds complexity to this serialized local workload | Reject                                                                   |
| Drizzle with a SQLite driver | Typed schema/query layer; migration generation; supports `node:sqlite`, `better-sqlite3`, and libSQL                                              | Adds an ORM and migration toolchain for only two tables; current official setup examples use release-candidate packages; does not remove the need to select a driver                   | Defer until schema/query complexity earns it                             |
| libSQL / Turso client        | Local files and remote Turso connections through one client; remote migration path; additional ALTER and encryption capabilities                  | Introduces a SQLite fork and cloud-shaped client abstraction that the local example does not require                                                                                   | Defer until remote persistence is a requirement                          |

Drizzle's official [SQLite driver comparison](https://orm.drizzle.team/docs/sqlite/get-started-sqlite) documents its support for libSQL, `node:sqlite`, and `better-sqlite3`, as well as libSQL's remote and additional database features. Its [`node:sqlite` getting-started guide](https://orm.drizzle.team/docs/get-started/node-sqlite-new) requires Node.js 22.5 or later and currently demonstrates `drizzle-orm@rc` and `drizzle-kit@rc`. These are useful future options, but they do not improve the first implementation enough to warrant the additional layer.

## Package and API implications

- Add `better-sqlite3` as a runtime dependency of `apps/web` only and `@types/better-sqlite3` as its development dependency.
- Keep all database imports in server-only repository, migration, and Route Handler modules. Client components and shared public packages must not import those modules.
- Expose a narrow repository interface in the example application for bootstrap, load, layout update, and Card update operations. Route Handlers translate between that interface and the public HTTP contract.
- Accept an injected database connection in the concrete repository. Production and local development use a shared file connection; tests can create an isolated connection.
- Keep driver-specific row and statement types inside the repository implementation.

## Operational defaults

- Read the file path from an environment variable and provide a safe application-local development default. Ignore the generated database, WAL, and shared-memory files in Git.
- Use one process-local connection in development so Next.js hot reloads do not continually create connections or lose in-memory state.
- Enable `PRAGMA foreign_keys = ON` for every connection.
- Use `PRAGMA journal_mode = WAL` for a file-backed database, matching the `better-sqlite3` README's general recommendation. Do not require WAL for `:memory:` tests.
- Run schema migrations before serving repository operations.
- Wrap default seeding and every revision-checked mutation in a database transaction.
- Keep prepared statements parameterized; do not interpolate user, Dashboard, or Card identifiers into SQL.
- Provide a repository test factory that accepts `:memory:` or a temporary file path. An in-memory database belongs to its connection, so migrations, repository operations, and assertions must share that connection.
- Close and reset test connections explicitly.
- Use the Node.js runtime for database Route Handlers. A SQLite native addon cannot run in the Edge runtime.

## Migration posture

Use numbered plain-SQL migration files and a small migration runner that records applied versions. This keeps the database state transparent, reviewable, and independent of an ORM. It also makes the initial schema straightforward to recreate in tests.

Keep storage behind the repository boundary and use portable schema choices where practical: UUID strings, text, integers, explicit foreign keys, indexes, and transactions. SQLite-specific details such as the partial unique index for one default Dashboard per owner remain isolated in migrations.

A future move from `better-sqlite3` to stable `node:sqlite` should affect the repository connection and statement plumbing, not the HTTP or React contracts. A future move to PostgreSQL or a hosted database would require another repository adapter and database-specific migrations, but the aggregate and transport contracts can remain intact.

Remote or serverless deployment is a separate architectural decision. A local SQLite file is ephemeral or non-shared on many hosts; changing the JavaScript SQLite driver does not solve that constraint. If Gridframe later requires multi-instance or durable hosted deployment, reassess libSQL/Turso or a server database based on those explicit requirements.

## Version caveats

This recommendation reflects official documentation available on 2026-07-11. Before implementation, pin a current compatible `better-sqlite3` release and verify that it provides prebuilt binaries for the repository's supported Node.js versions and development platforms. Review both the package's release notes and its bundled SQLite version when upgrading.
