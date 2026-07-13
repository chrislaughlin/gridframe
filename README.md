<img width="2172" height="724" alt="ChatGPT Image Jul 11, 2026, 04_00_57 PM" src="https://github.com/user-attachments/assets/e0d193ab-5a11-4b2a-8ab1-0205f2de72a4" />

# Gridframe

**A toolkit for building complex, customisable dashboards without rebuilding the same dashboard plumbing every time.**

Gridframe is a dashboard framework and companion service layer for building rich, user-configurable dashboards in modern frontend applications.

It gives you reusable dashboard components for the UI, plus a backend API layer for the product features that usually grow around dashboards: saved layouts, user customisation, sharing, reporting, permissions, exports, and more.

> Dashboards should be product features, not one-off engineering projects.

## Features

- **Static and API-managed modes** — Render from a static config object or bootstrap user-owned dashboards with persistence, the card library, mediated queries, and auto-generated deeplinks.
- **Eight visualisation types** — Metric, area, bar, line, pie, radar, radial, and table — each with type-safe payloads and shared validation schemas.
- **Responsive drag and resize** — Powered by `react-grid-layout` with a 4-column grid system, 96px row height, and 16px gap. Layout changes are persisted with optimistic updates and automatic rollback on failure.
- **Card library** — A trusted library of card templates. Users browse available visualisations, add them with first-fit placement, and remove them. All operations are transactional with revision-conflict detection.
- **Mediated card queries** — Server-side card data resolution keeps consumer API URLs out of the browser. The server looks up the card, resolves its source query against a consumer API, adapts the response to a visualisation payload, and proxies it to the client.
- **Owner-scoped deeplinks** — Each card gets a generated footer link with the card's visualisation and the exact normalised source records used to produce it.
- **Revision system** — Integer-based revision tokens for conflict detection. Optimistic mutations on the client; 409 responses trigger automatic refetch.
- **Comprehensive loading, empty, not-found, error, and revision-conflict states** for every component and handler.
- **Framework-neutral server handlers** — `@gridframe/server` exports Fetch-native `Request`/`Response` handlers that work with any framework (Next.js, Express, TanStack Start, Hono, etc.).
- **Typed client** — `@gridframe/client` provides a fully typed HTTP client with Zod-validated responses and typed error classes.

## Architecture

```
@gridframe/core          Zod schemas, types, layout validation (zero framework deps)
    ^
    ├── @gridframe/client    Typed HTTP client for the dashboard API
    ├── @gridframe/server    Framework‑neutral server handlers
    └── @gridframe/react     React UI components (uses @gridframe/client internally)
            ^
            └── @gridframe/ui    shadcn/ui‑style presentational components
```

- **`@gridframe/core`** — Canonical contracts, Zod schemas, TypeScript types, and pure layout validation. No framework dependencies.
- **`@gridframe/client`** — A typed HTTP client that wraps `fetch`, validates responses against core Zod schemas, and throws typed errors.
- **`@gridframe/server`** — Framework-neutral server handlers. Implement the `DashboardRepository` interface for your database, define your card library, provide a card data resolver, and get a full dashboard API.
- **`@gridframe/react`** — React components: `<PanelDashboard>` (static or API-managed mode), `<CardVisualization>`, `<SourceDataTable>`, and `<DashboardDrillDown>`. Owns its own TanStack Query client — no host-app provider setup needed.
- **`@gridframe/ui`** — shadcn/ui-style presentational primitives (Alert, Badge, Button, Card, Chart, Dialog, Empty, Skeleton, Table).

Data flow in API-managed mode:

```
Browser                          Server                       Consumer API
  │                                │                             │
  ├─ POST bootstrap ──────────────>│                             │
  │<─ Dashboard document ──────────│                             │
  │                                │                             │
  ├─ GET card/:id/data ───────────>│                             │
  │                                ├─ resolve Card definition ──>│
  │                                │<─ records ─────────────────│
  │                                │                             │
  │<─ validated visualisation ─────│                             │
  │                                │                             │
  ├─ PATCH layout ────────────────>│                             │
  │<─ OK / 409 conflict ───────────│                             │
```

## Packages

| Package             | Description                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `@gridframe/core`   | Zod schemas, types, constants (`DASHBOARD_GRID_COLUMNS = 4`), layout validation                     |
| `@gridframe/client` | Typed HTTP client for the dashboard REST API                                                        |
| `@gridframe/react`  | React dashboard components (PanelDashboard, CardVisualization, SourceDataTable, DashboardDrillDown) |
| `@gridframe/server` | Framework‑neutral Fetch-native server handlers                                                      |
| `@gridframe/ui`     | shadcn/ui-style presentational primitives                                                           |

## Install

```bash
pnpm add @gridframe/core @gridframe/react   # frontend (React components + schemas)
pnpm add @gridframe/server @gridframe/core   # backend (server handlers + schemas)
pnpm add @gridframe/client                   # standalone typed API client
```

### Peer dependencies

| Package             | Requires                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| `@gridframe/core`   | None (zero-dependency schemas + types)                                        |
| `@gridframe/react`  | `react@^19`, `react-dom@^19`                                                  |
| `@gridframe/server` | None (Fetch-native — works with Next.js, Express, Hono, TanStack Start, etc.) |
| `@gridframe/client` | None (standalone `fetch` wrapper)                                             |

### Import CSS

The React package provides pre-built styles for dashboard components and shadcn/ui charts:

```tsx
import "@gridframe/react/styles.css";
```

You also need Tailwind CSS v4 with `@tailwindcss/postcss` — see `apps/web/postcss.config.mjs` and `apps/web/app/globals.css` for the reference setup.

### Agent skills

Install Gridframe's consumer skills from this repository:

```bash
npx skills add chrislaughlin/gridframe
```

- [`setup-gridframe-dashboard`](skills/setup-gridframe-dashboard/SKILL.md) builds the first authenticated, API-managed Dashboard using the application's existing database and one real Card.
- [`add-gridframe-card`](skills/add-gridframe-card/SKILL.md) adds later Card definitions to the Card library and leaves the Dashboard seed unchanged unless asked.

Both skills require `@gridframe/server` 1.1.0 or newer.

Example prompts:

```text
Set up an API-managed Gridframe Dashboard using this app's auth and database. Use completed orders for the first revenue Card.
Add a revenue-by-region bar Card to the Gridframe Card library. Do not add it to the Dashboard seed.
```

### Minimal app setup

For a new Next.js project with the App Router:

```tsx
// app/layout.tsx
import "@gridframe/react/styles.css";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Getting started

### 1. Static dashboard (frontend only)

```tsx
import { PanelDashboard } from "@gridframe/react";
import "@gridframe/react/styles.css";

const config = {
  title: "Sales Overview",
  description: "Key metrics for Q1",
  cards: [
    {
      id: "card-1",
      name: "Total Revenue",
      layout: { x: 0, y: 0, width: 4, height: 2 },
      query: "...",
      visualization: {
        type: "metric",
        value: "$128,500",
        label: "Revenue",
        trend: { direction: "up", value: "12%" },
      },
    },
  ],
};

export default function Dashboard() {
  return <PanelDashboard config={config} />;
}
```

### 2. API-managed dashboard (with backend)

**Server (Next.js example):**

```ts
// app/api/gridframe/users/[userId]/dashboards/[dashboardId]/route.ts
import { createDashboardHandlers, defineCards } from "@gridframe/server";

const cards = defineCards({
  "total-revenue": {
    name: "Total revenue",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    resolve: async ({ userId }) => ({
      status: "success",
      data: {
        visualization: "metric",
        value: await revenueForUser(userId),
        label: "Revenue",
      },
    }),
  },
});

const handlers = createDashboardHandlers({
  repository: myDashboardRepository, // implements DashboardRepository
  cardLibrary: cards.cardLibrary,
  defaultDashboard: ({ userId }) => seed,
  resolveCardData: cards.resolveCardData,
});
```

Mount the returned handlers in route files for `bootstrap`, `layout`, `cards`, `card-library`, and `card/:id/data`.

**Client (React):**

```tsx
import { PanelDashboard } from "@gridframe/react";

export default function UserDashboard({ userId }: { userId: string }) {
  return (
    <PanelDashboard
      dashboard={{
        userId,
        apiBaseUrl: "/api/gridframe",
        onDashboardChange: (id) => console.log("active dashboard:", id),
      }}
    />
  );
}
```

### 3. Using the client directly

```ts
import { bootstrapDashboard, fetchDashboardCardData } from "@gridframe/client";

const { dashboard, dashboards } = await bootstrapDashboard({
  apiBaseUrl: "/api/gridframe",
  userId: "user-1",
});

const response = await fetchDashboardCardData({
  apiBaseUrl: "/api/gridframe",
  userId: "user-1",
  dashboardId: dashboard.id,
  cardId: "card-1",
});
// response.data.status === "success"
// response.data.data => PanelCardPayload (validated against Zod schema)
```

## Defining cards and dashboards

Cards are the atomic unit of a Gridframe dashboard. Every card has a visualization type, a layout position, and a data source. Dashboards are collections of cards with a title, optional description, and optional footer.

### Static dashboard config (frontend-only)

Pass a `PanelDashboardConfig` object directly to `<PanelDashboard config={...}>`:

```ts
import type { PanelDashboardConfig } from "@gridframe/react";
import type { PanelCardPayload } from "@gridframe/core";

const config: PanelDashboardConfig = {
  title: "Sales Overview",
  description: "Key metrics for Q1",
  footer: { text: "Updated daily" },
  cards: [
    {
      id: "card-1",
      name: "Total Revenue",
      layout: { x: 0, y: 0, width: 4, height: 2 },
      query: "/api/revenue",
      deeplink: { href: "/drill-down/revenue", label: "View source" },
      visualization: {
        type: "metric",
        value: 128_500,
        label: "Revenue",
        trend: { direction: "up", value: "12%" },
      } satisfies PanelCardPayload,
    },
    {
      id: "card-2",
      name: "Revenue by Region",
      layout: { x: 0, y: 2, width: 4, height: 4 },
      query: "/api/revenue-by-region",
      visualization: {
        type: "bar",
        indexKey: "region",
        data: [
          { region: "North", revenue: 62000 },
          { region: "South", revenue: 41000 },
          { region: "East", revenue: 38000 },
          { region: "West", revenue: 55000 },
        ],
        series: [{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }],
      } satisfies PanelCardPayload,
    },
  ],
};
```

The visualization payload (`PanelCardPayload`) is a discriminated union on `type`:

| `type`   | Required fields                         | Optional fields                                                                    |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `metric` | `value`, `label`                        | `helperText`, `trend` (`{direction, value, label?}`)                               |
| `bar`    | `indexKey`, `data`, `series`            | `layout`, `stacked`, `showLabels`, `tooltip`, `activeIndex`, `mixed`, `variant`    |
| `area`   | `indexKey`, `data`, `series`            | `curveType`, `stacked`, `stackOffset`, `showGradient`, `showLegend`, `interactive` |
| `line`   | `indexKey`, `data`, `series`            | `curveType`, `showDots`, `showLabels`, `interactive`                               |
| `pie`    | `nameKey`, `valueKey`, `data`, `series` | `donut`, `showLabels`, `showLegend`, `activeIndex`, `centerText`, `separator`      |
| `radar`  | `indexKey`, `data`, `series`            | `showDots`, `linesOnly`, `gridType`, `showLegend`, `customLabels`                  |
| `radial` | `nameKey`, `valueKey`, `data`, `series` | `showLabel`, `showGrid`, `centerText`, `shape`, `stacked`                          |
| `table`  | `columns`, `rows`                       | —                                                                                  |

### API-managed dashboard (with backend)

In API-managed mode, the server defines which cards exist and what data they produce. The client receives a dashboard document from the bootstrap endpoint.

**Server-side Card definitions** derive the Card library and data resolver together:

```ts
import { defineCards } from "@gridframe/server";

const cards = defineCards({
  "total-revenue": {
    name: "Total Revenue",
    description: "A headline revenue metric.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    deeplinkLabel: "View revenue source data",
    resolve: async ({ userId }) => ({
      status: "success",
      data: {
        visualization: "metric",
        value: await revenueForUser(userId),
        label: "Revenue",
      },
    }),
  },
  "recent-orders": {
    name: "Recent Orders",
    description: "The latest orders in a table.",
    visualization: "table",
    defaultLayout: { width: 4, height: 4 },
    resolve: async ({ userId }) => ({
      status: "success",
      data: {
        visualization: "table",
        columns: orderColumns,
        rows: await recentOrdersForUser(userId),
      },
    }),
  },
});
```

**Default dashboard seed** controls what a new user sees on first bootstrap:

```ts
import type { DashboardSeed } from "@gridframe/server";

const mySeed: DashboardSeed = {
  title: "My Dashboard",
  description: "A custom default dashboard",
  footer: { text: "Example footer" },
  cards: [
    {
      libraryItemKey: cards.definitions["total-revenue"].key,
      layout: { x: 0, y: 0, width: 1, height: 2 },
    },
    {
      libraryItemKey: cards.definitions["recent-orders"].key,
      layout: { x: 0, y: 2, width: 4, height: 4 },
    },
  ],
};
```

The seed is returned from the `defaultDashboard` callback passed to `createDashboardHandlers`.

Pass the derived library and resolver to the handlers:

```ts
const handlers = createDashboardHandlers({
  repository,
  cardLibrary: cards.cardLibrary,
  defaultDashboard: () => mySeed,
  resolveCardData: cards.resolveCardData,
});
```

### Card layout grid

The dashboard uses a 4-column grid (`DASHBOARD_GRID_COLUMNS = 4`) with 96px row height and 16px gap. Layouts are defined as `{x, y, width, height}` where `x` and `width` are in column units (0–3, max width 4) and `y` and `height` are in row units. When a card is added from the library, placement is automatic (first-fit, top-to-left-to-right).

## Custom styling and theming

Gridframe uses CSS custom properties for all colors, so theming is just a matter of overriding the variables.

### Theme variables

The built-in stylesheet (`@gridframe/react/styles.css`) defines these variables with light and dark defaults. Override them in your own CSS after the import:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@gridframe/react/styles.css";

:root {
  /* Semantic colors */
  --background: oklch(0.985 0.006 250);
  --foreground: oklch(0.22 0.018 255);
  --card: oklch(0.998 0.004 250);
  --card-foreground: oklch(0.22 0.018 255);
  --popover: oklch(0.998 0.004 250);
  --popover-foreground: oklch(0.22 0.018 255);
  --primary: oklch(0.47 0.14 252);
  --primary-foreground: oklch(0.985 0.006 250);
  --secondary: oklch(0.94 0.012 250);
  --secondary-foreground: oklch(0.28 0.018 255);
  --muted: oklch(0.94 0.012 250);
  --muted-foreground: oklch(0.51 0.026 255);
  --accent: oklch(0.91 0.035 246);
  --accent-foreground: oklch(0.28 0.06 252);
  --destructive: oklch(0.58 0.18 25);
  --border: oklch(0.88 0.015 250);
  --input: oklch(0.88 0.015 250);
  --ring: oklch(0.54 0.13 252);

  /* Chart colors (used by series definitions) */
  --chart-1: oklch(0.55 0.16 252);
  --chart-2: oklch(0.58 0.13 180);
  --chart-3: oklch(0.62 0.14 75);
  --chart-4: oklch(0.58 0.16 315);
  --chart-5: oklch(0.52 0.12 30);

  /* Border radius */
  --radius: 0.5rem;
}
```

To add dark mode, wrap overrides in a `prefers-color-scheme: dark` media query or a `.dark` class selector:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.18 0.018 255);
    --foreground: oklch(0.93 0.012 250);
    --card: oklch(0.22 0.02 255);
    --primary: oklch(0.68 0.13 252);
    /* ... override every variable for dark mode ... */
  }
}

/* Or with a class-based toggle: */
.dark {
  --background: oklch(0.18 0.018 255);
  /* ... same overrides ... */
}
```

### Chart colors

Each card's `series` array references chart colors by variable name:

```ts
series: [
  { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
  { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
];
```

Swap out the `--chart-*` values to change the entire dashboard's chart palette at once. Add more chart variables (`--chart-5`, `--chart-6`, etc.) and reference them in new card definitions.

### Layout customization

The grid dimensions are controlled by constants in `@gridframe/core`:

| Constant                 | Default | Description                                                                                                          |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `DASHBOARD_GRID_COLUMNS` | `4`     | Number of columns in the layout grid. Changing this affects the first-fit placement algorithm and layout validation. |

Row height and gap are set in the React component styles and can be overridden:

```css
/* Override grid row height and gap */
.react-grid-layout {
  --gridframe-row-height: 80px;
  --gridframe-gap: 12px;
}
```

### Tailwind CSS v4 integration

If you use Tailwind CSS v4, wire the CSS variables as theme tokens so you can use them with Tailwind utility classes:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

This lets you use classes like `bg-card text-muted-foreground border-border` in your own components alongside the dashboard.

### Reference: complete globals.css

See [`apps/web/app/globals.css`](apps/web/app/globals.css) for the full theme setup used by the example app, including light/dark color schemes, font configuration, and Tailwind integration.

## Consumer API and database integration

Gridframe separates Dashboard state from Card data. The Dashboard repository stores structure (titles, layouts, Card names), while each Card definition resolves its Visualization data on the server. A resolver can query the consumer's database or services directly. The example app uses an additional mediated consumer API to demonstrate SSRF-safe proxying; that `sourceQuery` field is application-owned and is not part of Gridframe's public `PersistedDashboardCard` contract.

### Architecture

```
Browser                      Gridframe server                   Consumer API / Database
  │                               │                                     │
  │  POST /bootstrap              │                                     │
  │──────────────────────────────>│  Create/lookup default dashboard     │
  │                               │  └─ Postgres: insert dashboards,    │
  │                               │     dashboard_cards rows            │
  │<──────────────────────────────│                                     │
  │  { dashboards, dashboard }    │                                     │
  │                               │                                     │
  │  GET /cards/:id/data          │                                     │
  │──────────────────────────────>│  Look up card in DB                 │
  │                               │  └─ Postgres: SELECT source_query   │
  │                               │                                     │
  │                               │  Validate + proxy to consumer API   │
  │                               │────────────────────────────────────>│
  │                               │  { records: [...] }                 │
  │                               │<────────────────────────────────────│
  │                               │                                     │
  │                               │  Adapt records into PanelCardPayload│
  │<──────────────────────────────│                                     │
  │  { status: "success", data }  │                                     │
```

### Database (dashboard persistence)

The database stores dashboards and their cards. It does **not** store the visualized data — only configuration.

You implement the `DashboardRepository` interface for your database of choice. A repository can retain additional private fields, such as the example app's internal source query, without exposing them through Gridframe's public Dashboard document:

```ts
// repositories/SqliteDashboardRepository.ts
import Database from "better-sqlite3";
import {
  createDashboardHandlers,
  type DashboardRepository,
} from "@gridframe/server";

class SqliteDashboardRepository implements DashboardRepository {
  constructor(private db: Database.Database) {}

  bootstrap(userId, dashboardId, seed, cardLibrary) {
    /* ... */
  }
  loadDashboard(userId, dashboardId) {
    /* ... */
  }
  updateLayout(userId, dashboardId, revision, cards) {
    /* ... */
  }
  updateCardName(userId, dashboardId, cardId, revision, name) {
    /* ... */
  }
  listCardLibrary(userId, dashboardId) {
    /* ... */
  }
  addCard(userId, dashboardId, revision, card) {
    /* ... */
  }
  removeCard(userId, dashboardId, cardId, revision) {
    /* ... */
  }
  findOwnedCard(userId, dashboardId, cardId) {
    /* ... */
  }
}
```

**Key implementation details from the example repository:**

- **Migrations** — Schema changes use the application's normal migration system.
- **Revision locking** — Every mutation checks the Dashboard's `revision` atomically. If it does not match, the repository throws `DashboardRevisionConflictError` and the client refetches.
- **Transactions** — Mutations that touch multiple rows run inside database transactions.
- **Private row fields** — The example stores an internal `source_query` used by its custom proxy. Gridframe serialization omits repository-specific fields.

### Consumer API (card data)

The example consumer API returns source records for each Card key. This separate route is optional; production Card definitions may resolve data directly.

Minimal consumer endpoint (from the example app):

```ts
// app/api/consumer/cards/[sourceKey]/route.ts
import { createConsumerCardHandler } from "~/server/dashboard/consumer-handler";

export async function GET(request, { params }) {
  const { sourceKey } = await params;
  return createConsumerCardHandler()(sourceKey);
}
```

The consumer returns JSON with a `records` array:

```json
{
  "records": [
    { "region": "North", "revenue": 62000 },
    { "region": "South", "revenue": 41000 }
  ]
}
```

### Mediated card data flow

The actual card data request path is:

1. Browser calls `GET /api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId/data`
2. Server looks up the card in the database (`findOwnedCard`) — validates ownership
3. Server reads the persisted `source_query` from the card row (e.g., `/api/consumer/cards/total-revenue`)
4. Server validates the source URL is safe (no path traversal, same-origin with `GRIDFRAME_CONSUMER_API_BASE_URL`)
5. Server fetches the consumer API, enforcing a 3-second timeout and forwarding the request's abort signal
6. Server adapts the raw records into a `PanelCardDataResponse` using the card definition's `adapt` function
7. If `?includeSource=true`, the server also attaches the normalized source records for drill-down views
8. Server returns the validated payload to the browser

This mediation ensures:

- **Internal URLs stay internal** — the browser only knows Gridframe API paths
- **SSRF protection** — `resolveSourceUrl` in `apps/web/server/dashboard/card-data-handler.ts` rejects absolute URLs, path traversal (`..`), protocol-relative URLs (`//`), fragments, and requests outside the configured consumer base path
- **Error sanitization** — upstream failures produce a generic `CARD_QUERY_FAILED` (502) response, never leaking internal error details or stack traces
- **Deterministic data** — in the example app, consumer records are seeded by card key using `@faker-js/faker` with a deterministic seed, so repeated requests return identical data

### Card data resolver (server package)

`defineCards` creates the `resolveCardData` callback used by the built-in `fetchCardData` handler:

```ts
const cards = defineCards({
  revenue: {
    name: "Revenue",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    resolve: async ({ userId }) => {
      const total = await revenueForUser(userId);
      return {
        status: "success",
        data: {
          visualization: "metric",
          value: total,
          label: "Revenue",
        },
      };
    },
  },
});

const handlers = createDashboardHandlers({
  repository: myRepo,
  cardLibrary: cards.cardLibrary,
  defaultDashboard: () => mySeed,
  resolveCardData: cards.resolveCardData,
});
```

You can then mount `handlers.fetchCardData` in a route:

```ts
// app/api/gridframe/.../cards/[cardId]/data/route.ts
export async function GET(request, { params }) {
  const { userId, dashboardId, cardId } = await params;
  return handlers.fetchCardData(request, { userId, dashboardId, cardId });
}
```

The example app uses a custom `card-data-handler.ts` instead of the built-in `fetchCardData` because it needs to add SSRF-safe URL resolution and source record adaptation on top of the basic consumer fetch. You can choose either approach depending on your needs.

### Configuration

| Env variable                      | Default                               | Purpose                                                                             |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | required                              | Neon Postgres connection URL used by the example Dashboard repository.              |
| `TEST_DATABASE_URL`               | none                                  | Dedicated Neon database used by integration tests.                                  |
| `GRIDFRAME_CONSUMER_API_BASE_URL` | `http://localhost:3000/api/consumer/` | Base URL for the mediated card data proxy. Only URLs under this base are forwarded. |

### Using a different database

The `DashboardRepository` interface is database-agnostic. Implement it for PostgreSQL, MySQL, MongoDB, or any other store:

```ts
import { type DashboardRepository } from "@gridframe/server";

class PostgresDashboardRepository implements DashboardRepository {
  // Implement all DashboardRepository methods using your DB client
}
```

Then pass it to `createDashboardHandlers`:

```ts
const handlers = createDashboardHandlers({
  repository: new PostgresDashboardRepository(pool),
  cardLibrary: cards.cardLibrary,
  defaultDashboard: ({ userId }) => seed,
  resolveCardData: cards.resolveCardData,
});
```

The `NeonDashboardRepository` in `apps/web/server/dashboard/repository.ts` is the reference implementation.

## Server integration

`@gridframe/server` exports Fetch-native handlers. Mount them in any framework:

<details>
<summary><b>Next.js App Router</b></summary>

```ts
// app/api/gridframe/users/[userId]/dashboards/bootstrap/route.ts
const handlers = createDashboardHandlers(options);

export async function POST(request, { params }) {
  const { userId } = await params;
  return handlers.bootstrap(request, { userId });
}
```

</details>

<details>
<summary><b>Express</b></summary>

```ts
const handlers = createDashboardHandlers(options);

router.post(
  "/api/gridframe/users/:userId/dashboards/bootstrap",
  async (req, res) => {
    const request = new Request(`http://host${req.originalUrl}`, {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: req.headers,
    });
    const response = await handlers.bootstrap(request, req.params);
    res.status(response.status).json(await response.json());
  },
);
```

</details>

<details>
<summary><b>TanStack Start / Hono / other Fetch servers</b></summary>

```ts
const handlers = createDashboardHandlers(options);

app.post("/api/gridframe/users/:userId/dashboards/bootstrap", async (c) => {
  const request = c.req.raw;
  return handlers.bootstrap(request, { userId: c.req.param("userId") });
});
```

</details>

Authenticate each request before calling a handler and derive or verify `userId` from the server-side identity. Mount the remaining operations at the paths in the handler reference below.

### Required interface: `DashboardRepository`

Implement this interface for your database:

```ts
interface DashboardRepository {
  bootstrap(
    ownerUserId: string,
    dashboardId: string | undefined,
    seed: DashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[],
  ): MaybePromise<DashboardBootstrap>;
  loadDashboard(
    ownerUserId: string,
    dashboardId: string,
  ): MaybePromise<PersistedDashboard>;
  updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): MaybePromise<PersistedDashboard>;
  updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): MaybePromise<PersistedDashboard>;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): MaybePromise<PersistedDashboard>;
  removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ): MaybePromise<PersistedDashboard>;
  findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): MaybePromise<PersistedDashboardCard | undefined>;
}
```

The reference implementation is `NeonDashboardRepository` in `apps/web/server/dashboard/repository.ts`.

### `defineCards`

`defineCards(definitions)` preserves typed definition keys and returns:

| Field             | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `definitions`     | Card definitions with their object keys exposed as stable `key` values |
| `cardLibrary`     | `CardLibraryTemplate[]` derived from definition metadata               |
| `resolveCardData` | Validated dispatcher for `createDashboardHandlers`                     |

### `DashboardHandlerOptions`

| Option             | Type                                                               | Description                                        |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------- |
| `repository`       | `DashboardRepository`                                              | Persistence layer                                  |
| `cardLibrary`      | `CardLibraryTemplate[]`                                            | Available card templates                           |
| `defaultDashboard` | `(params: { userId: string }) => DashboardSeed`                    | Generates the initial dashboard for a new user     |
| `resolveCardData`  | `(input: CardDataResolverInput) => Promise<PanelCardDataResponse>` | Resolves a Card definition into Visualization data |
| `urls?`            | `{ apiBasePath?: string; dashboardBasePath?: string }`             | URL prefixes for serialization                     |

### Handler reference

| Handler                              | Route                        | Description                                                       |
| ------------------------------------ | ---------------------------- | ----------------------------------------------------------------- |
| `bootstrap(request, identity)`       | `POST /.../dashboards`       | Create or load a user's default/selected dashboard                |
| `updateLayout(request, identity)`    | `PATCH .../layout`           | Persist a complete card layout (revision-gated)                   |
| `updateCard(request, identity)`      | `PATCH .../cards/:cardId`    | Rename a card (revision-gated)                                    |
| `listCardLibrary(request, identity)` | `GET .../card-library`       | List all templates with install status                            |
| `addCard(request, identity)`         | `POST .../cards`             | Add a card from the library (revision-gated, first-fit placement) |
| `removeCard(request, identity)`      | `DELETE .../cards/:cardId`   | Remove a card (revision-gated)                                    |
| `fetchCardData(request, identity)`   | `GET .../cards/:cardId/data` | Resolve card data via `resolveCardData`                           |

## Client API

`@gridframe/client` exports these functions:

```ts
bootstrapDashboard(options); // POST /users/:userId/dashboards/bootstrap
fetchDashboardCardData(options); // GET .../cards/:cardId/data
updateDashboardLayout(options); // PATCH .../layout
updateDashboardCard(options); // PATCH .../cards/:cardId
listCardLibrary(options); // GET .../card-library
addDashboardCard(options); // POST .../cards
removeDashboardCard(options); // DELETE .../cards/:cardId
```

All functions accept:

```ts
{
  apiBaseUrl?: string;       // default: "/api/gridframe"
  signal?: AbortSignal;      // abort the fetch
  // plus route-specific parameters (userId, dashboardId, cardId, etc.)
}
```

Responses are validated against the Zod schemas in `@gridframe/core`. On validation failure or API error, a `DashboardClientError` is thrown with `status`, `code`, and `message`.

## React component reference

| Component            | Props                                                                                     | Description                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `PanelDashboard`     | `config: PanelDashboardConfig` (static) or `dashboard: ApiPanelDashboardConfig` (managed) | Root dashboard component. Owns its TanStack Query client.                                     |
| `CardVisualization`  | `data: PanelCardPayload`                                                                  | Renders the correct chart/metric/table for the given payload                                  |
| `SourceDataTable`    | `data: SourceDataTable`                                                                   | Renders a source data table with column alignment                                             |
| `DashboardDrillDown` | drill-down params                                                                         | Full page: bootstraps dashboard, fetches card with source data, renders visualisation + table |

## Run the complete example

### Prerequisites

- **Node.js** >= 20.9
- **pnpm** >= 9.0 (install with `corepack enable && corepack prepare pnpm@9 --activate`)
- **TypeScript** 5.9

### Clone and install

```bash
git clone <repo-url>
cd gridframe
pnpm install
```

### Start in development mode

```bash
pnpm dev
```

This runs the Turborepo pipeline which starts both apps:

| App      | URL                   | Description                                           |
| -------- | --------------------- | ----------------------------------------------------- |
| **web**  | http://localhost:3000 | Full API-managed Dashboard example with Neon Postgres |
| **docs** | http://localhost:3001 | Documentation and component showcase                  |

### What you'll see

Open http://localhost:3000. The home page immediately redirects to `/gridframe/users/example-user/dashboards`. On the first request, the server:

1. Connects to Neon Postgres using `DATABASE_URL` and initializes the idempotent schema
2. Bootstraps a default dashboard ("Operations overview") for `example-user`
3. Seeds three initial cards: Total revenue (metric), Revenue by region (bar), Recent orders (table)
4. Returns the dashboard document to the browser

Once loaded, you can:

- **Drag and resize** Cards — layout changes are persisted to Postgres with revision-conflict detection
- **Rename a card** — click the card header to edit
- **Open the card library** — add any of the 8 visualisation types (area, line, pie, radar, radial charts)
- **Remove and re-add** cards — the library tracks which cards are installed and uses first-fit placement
- **Follow a card deeplink** — click a card footer link to drill down into the card's visualisation and see the exact normalised source records used to produce it

### Reset data

```bash
psql "$DATABASE_URL" -c "DELETE FROM dashboards WHERE owner_user_id = 'example-user';"
```

Use a dedicated Neon branch or database when resetting example data. The foreign key cascades to the user's Cards; the next request bootstraps a new default Dashboard.

### Build for production

```bash
pnpm build
```

Builds all packages and apps. Output goes to:

- `packages/react/dist/` — compiled React components + CSS
- `apps/web/.next/` — Next.js production build
- `apps/docs/.next/` — Next.js production build

### Start production server

```bash
pnpm start           # starts all apps in production mode
pnpm --filter web start   # or just the web app
```

### Verify everything works

```bash
pnpm check-types     # TypeScript type checking across all packages and apps
pnpm lint            # ESLint (zero warnings required)
pnpm test            # Vitest runs across all packages and apps
pnpm build           # Full production build
```

## Workspace

- `packages/core` — canonical contracts, schemas, and Dashboard layout validation
- `packages/client` — typed Dashboard API client
- `packages/react` — Dashboard UI plus shared `CardVisualisation` and `SourceDataTable`
- `packages/server` — framework-neutral Dashboard API handlers and repository contracts
- `packages/ui` — shadcn/ui-style presentational primitives
- `apps/web` — complete Next.js, Neon Postgres, and faker-backed consumer example
- `apps/docs` — documentation application
