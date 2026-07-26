# web — Gridframe dashboard example

A Next.js (App Router) application that demonstrates the full API-managed dashboard flow:

- lazy Neon Postgres-backed dashboard creation per user;
- persisted Card layouts and names with revision conflict handling;
- Card library add/remove across every visualization type;
- server-mediated data queries with SSRF protection;
- Card deeplinks with source-data drill-down;
- AI-generated proposals that create or edit Dashboards through an explicit,
  validated Apply step.

## Quick start

```sh
pnpm dev   # root monorepo — serves web on :3000
```

Open [localhost:3000](http://localhost:3000) for the product site, or go
directly to
[`/gridframe/users/example-user/dashboards`](http://localhost:3000/gridframe/users/example-user/dashboards)
to boot the example user's Dashboard and try **Create with AI**.

## Package reference

All framework packages live in the monorepo under `packages/`:

| Package             | Description                                                                                                                                   | Source                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@gridframe/core`   | Zod schemas, types, and constants (40+ schemas for dashboard documents, cards, layouts, API requests/responses)                               | [`packages/core/src/index.ts`](../../packages/core/src/index.ts)                                                   |
| `@gridframe/server` | `createDashboardHandlers` factory, repository interface, and error classes (`DashboardNotFoundError`, `DashboardRevisionConflictError`, etc.) | [`packages/server/src/index.ts`](../../packages/server/src/index.ts) — [`README`](../../packages/server/README.md) |
| `@gridframe/client` | Fetch wrappers for the dashboard API — `bootstrapDashboard`, `addDashboardCard`, `updateDashboardLayout`, `fetchDashboardCardData`, etc.      | [`packages/client/src/index.ts`](../../packages/client/src/index.ts)                                               |
| `@gridframe/react`  | React components — `PanelDashboard`, `CardVisualization`, `DashboardDrillDown`, `SourceDataTable`                                             | [`packages/react/src/index.ts`](../../packages/react/src/index.ts) — [`README`](../../packages/react/README.md)    |

## Architecture

The app is split into four layers:

```
app/                          # Next.js App Router — routes + pages + API
  page.tsx                    #   product landing page
  layout.tsx                  #   root layout (fonts and CSS)
  gridframe/                  #   frontend routes
    users/[userId]/dashboards/
      page.tsx                #     /gridframe/.../dashboards
      dashboard-page.tsx      #     shared client-side DashboardPage wrapper
      [dashboardId]/
        page.tsx              #     /gridframe/.../dashboards/:dashboardId
        cards/[cardId]/
          page.tsx            #     /gridframe/.../cards/:cardId (drill-down)
  api/                        #   backend routes
    consumer/cards/[sourceKey]/route.ts  # faker-based data endpoint
    gridframe/.../{bootstrap,layout,cards,card-library}/route.ts  # dashboard CRUD
    gridframe/users/[userId]/ai/dashboard-proposals/  # propose, validate, apply

server/dashboard/             # Server-side logic (not a Next.js convention, just a directory)
  handlers.ts                 #   wires @gridframe/server to local types
  repository.ts               #   NeonDashboardRepository (Postgres persistence)
  service.ts                  #   singleton factory for the repository
  database.ts                 #   Neon HTTP client + schema initializer
  card-definitions.ts         #   8 card types with deterministic faker data
  ai-data-fields.ts           #   semantic, AI-safe field catalogue
  ai.ts                       #   provider selection + Dashboard AI service
  card-data-handler.ts        #   mediated card data (SSRF-safe proxy)
  consumer-handler.ts         #   faker API endpoint
  seed.ts                     #   default dashboard configuration
  schema.sql                  #   idempotent PostgreSQL schema

packages/                     # @gridframe/* monorepo packages
  @gridframe/core             #   Zod schemas, types, constants
  @gridframe/server           #   createDashboardHandlers factory + error classes
  @gridframe/react            #   PanelDashboard + DashboardDrillDown components
  @gridframe/client           #   fetch wrappers (used by @gridframe/react internally)
```

## Layer 1 — Server layer (`server/dashboard/`)

### Database (`database.ts`)

Creates an HTTP query client with `@neondatabase/serverless` using `DATABASE_URL`. On first use it applies the idempotent PostgreSQL schema in `schema.sql`. A PostgreSQL advisory transaction lock makes initialization safe when multiple app or test workers start concurrently.

Schema (`schema.sql`):

- **`dashboards`** — scoped to `owner_user_id`, enforces one default per user via a filtered unique index, tracks `revision` for optimistic concurrency.
- **`dashboard_cards`** — foreign key to `dashboards` with CASCADE delete, stores layout (`grid_x`/`grid_y`/`grid_width`/`grid_height`), `source_query`, optional `deeplink_json`, and a unique constraint on `(dashboard_id, library_item_key)` to prevent duplicates.

### Repository (`repository.ts`)

`NeonDashboardRepository` implements both a local `DashboardRepository` interface and the `GridframeDashboardRepository` type from `@gridframe/server`. It uses parameterized Neon HTTP queries. Mutations use PostgreSQL data-modifying CTEs so revision checks and Card changes are atomic without requiring a stateful database session.

### Service (`service.ts`)

Singleton factory. Requires `DATABASE_URL`, creates the Neon HTTP client once, wraps it in `NeonDashboardRepository`, and caches the repository for the lifetime of the server process.

### Handlers (`handlers.ts`)

The bridge to `@gridframe/server`:

```ts
function getDashboardHandlers() {
  return createDashboardHandlers({
    repository: getDashboardRepository(),
    cardLibrary,
    defaultDashboard: () => defaultDashboardSeed,
    resolveCardData: resolveExampleCardData,
  });
}
```

Each API route imports `getDashboardHandlers` and calls the relevant handler method (e.g., `handlers.bootstrap(request, {userId})`). See [Layer 2](#layer-2--api-routes) below.

### Card definitions (`card-definitions.ts`)

Each card type is defined as an object with:

| Field                    | Purpose                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `key`                    | Unique identifier used in API calls and for deterministic faker seeding                 |
| `name`                   | Display name shown in the UI                                                            |
| `description`            | Shown in the card library picker                                                        |
| `visualization`          | One of `metric` \| `bar` \| `table` \| `area` \| `line` \| `pie` \| `radar` \| `radial` |
| `defaultLayout`          | `{width, height}` in grid units (4-column grid, `DASHBOARD_GRID_COLUMNS`)               |
| `deeplinkLabel`          | Label for the drill-down link                                                           |
| `generateRecords(faker)` | Returns deterministic source records                                                    |
| `adapt(records)`         | Converts source records to a `PanelCardDataResponse`                                    |

The eight built-in cards are:

| Key                 | Viz    | Layout | Data source               |
| ------------------- | ------ | ------ | ------------------------- |
| `total-revenue`     | metric | 1x2    | Sum of 12 faker amounts   |
| `revenue-by-region` | bar    | 3x4    | Per-region revenue        |
| `recent-orders`     | table  | 4x4    | 8 fake orders with status |
| `revenue-trend`     | area   | 2x4    | Monthly revenue           |
| `orders-trend`      | line   | 2x4    | Monthly order count       |
| `channel-share`     | pie    | 2x4    | Revenue by channel        |
| `team-performance`  | radar  | 2x4    | Performance dimensions    |
| `goal-progress`     | radial | 2x4    | Goal progress metrics     |

The example uses `defineCards`, which derives the exported `cardLibrary` array and `resolveExampleCardData` dispatcher passed to `createDashboardHandlers`.

The same definitions include optional `ai` metadata. `defineCards` derives an
`aiCardLibrary` containing only those approved Cards, so the model never sees
Card definitions that have not opted into planning.

### Seed config (`seed.ts`)

`defaultDashboardSeed` defines the initial dashboard that gets lazily created on first bootstrap:

- title: "Operations overview"
- description and footer text
- three starter cards: total-revenue, revenue-by-region, recent-orders

### Card data handler (`card-data-handler.ts`)

A mediated proxy that reads the card's `sourceQuery` (persisted in the DB), validates it's a safe consumer-API URL (no path traversal, same-origin check), fetches from the consumer API, and adapts the response into `PanelCardDataResponse` format. This ensures:

- source queries are locked at card-definition time, not attacker-controlled;
- SSRF protection via origin/pathname validation;
- error surfaces are sanitized (upstream errors produce generic `CARD_QUERY_FAILED`).

The consumer API base URL is configurable via `GRIDFRAME_CONSUMER_API_BASE_URL`.

### Consumer handler (`consumer-handler.ts`)

A lightweight faker-backed endpoint that returns deterministic records for a given card key. Seeded by `key` so repeated calls return identical data. Registered at `app/api/consumer/cards/[sourceKey]/route.ts`.

## Layer 2 — API routes (`app/api/gridframe/`)

All API routes follow the same pattern — import `getDashboardHandlers`, call the relevant handler:

| Route                                                                     | Method | Handler                     | Purpose                                                                                                              |
| ------------------------------------------------------------------------- | ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/api/gridframe/users/:userId/dashboards/bootstrap`                       | POST   | `handlers.bootstrap`        | Lazy-create or load user's default dashboard. Idempotent — re-bootstrapping the same user returns the same dashboard |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/layout`             | PATCH  | `handlers.updateLayout`     | Update card positions/sizes with revision check                                                                      |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/cards`              | POST   | `handlers.addCard`          | Add a card from the library (revision-gated)                                                                         |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId`      | PATCH  | `handlers.updateCard`       | Rename a card (revision-gated)                                                                                       |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId`      | DELETE | `handlers.removeCard`       | Remove a card (revision-gated)                                                                                       |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/card-library`       | GET    | `handlers.listCardLibrary`  | List available cards with add/removed state                                                                          |
| `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId/data` | GET    | `card-data-handler`         | Fetch card data via the SSRF-safe mediator                                                                           |
| `/api/gridframe/users/:userId/ai/dashboard-proposals`                     | POST   | `proposeDashboard`          | Generate, repair when needed, validate, and preview a proposal without writing                                       |
| `/api/gridframe/users/:userId/ai/dashboard-proposals/validate`            | POST   | `validateDashboardProposal` | Validate a supplied proposal against current permissions, Cards, fields, and layout                                  |
| `/api/gridframe/users/:userId/ai/dashboard-proposals/apply`               | POST   | `applyDashboardProposal`    | Revalidate and create or replace a Dashboard transactionally with revision checks                                    |

All routes use the Next.js Node.js runtime.

## Layer 3 — React components (`@gridframe/react`)

The app uses two components from `@gridframe/react`:

### `PanelDashboard`

Placed at the `/dashboards` routes via `DashboardPage` (a thin client-side wrapper). Takes a `dashboard` prop with:

```ts
{
  userId: string;
  dashboardId?: string;       // omitting triggers default-dashboard bootstrap
  onDashboardChange?: (nextId: string) => void;
}
```

It renders the full dashboard UI: title, Cards (Visualizations), global filters,
footer, Card library drawer, layout editing, and the **Create with AI** dialog.
The dialog can propose edits to the current Dashboard or a new named Dashboard.
It previews every action and the final layout, and it does not write until the
user selects **Apply proposal**. On first render the component POSTs to
`/bootstrap` to lazily create the user's default Dashboard.

### `DashboardDrillDown`

Placed at `/cards/:cardId` routes. Takes `{userId, dashboardId, cardId}` and renders a zoomed-in card visualization plus a source-data table underneath.

## Layer 4 — Layout (`app/layout.tsx`)

- Root layout imports `@gridframe/react/styles.css` (shadcn/ui chart components), Tailwind globals, and Geist fonts.
- A small client cleanup removes registrations left behind by the development-only mock worker used in earlier versions of the app. API requests are always handled by the real Next.js routes.

## Environment variables

| Variable                          | Default                               | Purpose                                                                 |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`                    | required                              | Pooled or direct Neon Postgres connection URL                           |
| `TEST_DATABASE_URL`               | none                                  | Dedicated Neon database for integration tests                           |
| `GRIDFRAME_CONSUMER_API_BASE_URL` | `http://localhost:3000/api/consumer/` | Base URL for the SSRF-safe Card data mediator                           |
| `GRIDFRAME_AI_PROVIDER`           | `openrouter`                          | `openrouter`, `openai`, `anthropic`, `google`, or `openai-compatible`   |
| `GRIDFRAME_AI_MODEL`              | provider default                      | Optional provider model override; required for `openai-compatible`      |
| `GRIDFRAME_AI_BASE_URL`           | provider endpoint                     | Optional endpoint override; required for `openai-compatible`            |
| `GRIDFRAME_AI_API_KEY`            | none                                  | Generic credential override; may be empty for a local compatible server |

Set the selected provider credential on the server: `OPENROUTER_API_KEY`,
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`. The example returns
`AI_NOT_CONFIGURED` until a usable provider configuration is present.

The public example only accepts same-origin AI requests for its fixed
`example-user` identity. That keeps the demo runnable but is not an
authentication pattern for production. A host application must derive
`principalId` from its authenticated server session, check it against the route
identity, and rate-limit provider usage as appropriate.

The app loads the repository-root `.env.development.local` during local Next.js development. In deployed environments, provide `DATABASE_URL` through the platform's environment configuration.

The app initializes the schema automatically. To create the tables manually instead, run the provided script with a PostgreSQL client:

```sh
psql "$DATABASE_URL" -f apps/web/server/dashboard/schema.sql
```

## Adding a new card type

1. Add an entry to the `cardDefinitions` record in `server/dashboard/card-definitions.ts`. Give it a unique key, a visualization type, a generator, and an adapter.
2. (Optional) Add it to the `cards` array in `server/dashboard/seed.ts` to include it in the default dashboard.
3. The card library is built from `Object.values(cardDefinitions)` — any new entry appears automatically in the add-card picker.

## Testing

```sh
pnpm test          # from root — runs all package tests
pnpm --filter web test  # only web app tests
```

Database tests run only when `TEST_DATABASE_URL` points to a database other than `DATABASE_URL`. Use a dedicated Neon branch or database: the tests create isolated test-owner Dashboards and remove those rows after each test. Without it, Neon integration tests are skipped while database-independent tests continue to run.
