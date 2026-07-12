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
  │                                ├─ fetch(sourceQuery) ───────>│
  │                                │<─ records ─────────────────│
  │                                │                             │
  │<─ validated visualisation ─────│                             │
  │                                │                             │
  ├─ PATCH layout ────────────────>│                             │
  │<─ OK / 409 conflict ───────────│                             │
```

## Packages

| Package | Description |
|---------|-------------|
| `@gridframe/core` | Zod schemas, types, constants (`DASHBOARD_GRID_COLUMNS = 4`), layout validation |
| `@gridframe/client` | Typed HTTP client for the dashboard REST API |
| `@gridframe/react` | React dashboard components (PanelDashboard, CardVisualization, SourceDataTable, DashboardDrillDown) |
| `@gridframe/server` | Framework‑neutral Fetch-native server handlers |
| `@gridframe/ui` | shadcn/ui-style presentational primitives |

## Install

```bash
pnpm add @gridframe/react @gridframe/core
# or for the server side:
pnpm add @gridframe/server @gridframe/core
# or for just the API client:
pnpm add @gridframe/client
```

All packages require `@gridframe/core` (Zod schemas and types). Peer dependencies:
- `@gridframe/react` requires React 19 and React DOM 19.
- `@gridframe/server` has no framework peer dependency — use it with Next.js, Express, Hono, TanStack Start, or any Fetch-capable server.

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
import { createDashboardHandlers } from "@gridframe/server";

const handlers = createDashboardHandlers({
  repository: myDashboardRepository,    // implements DashboardRepository
  cardLibrary: myCardDefinitions,       // CardLibraryTemplate[]
  defaultDashboard: ({ userId }) => seed,
  resolveCardData: async ({ card }) => fetchFromConsumer(card.sourceQuery),
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

const { dashboard } = await bootstrapDashboard({
  apiBaseUrl: "/api/gridframe",
  userId: "user-1",
});

const response = await fetchDashboardCardData({
  apiBaseUrl: "/api/gridframe",
  userId: "user-1",
  dashboardId: dashboard.id,
  cardId: "card-1",
});
// response.data => PanelCardPayload (validated against Zod schema)
```

## Server integration

`@gridframe/server` exports Fetch-native handlers. Mount them in any framework:

<details>
<summary><b>Next.js App Router</b></summary>

```ts
// app/api/gridframe/users/[userId]/dashboards/[dashboardId]/route.ts
const handlers = createDashboardHandlers(options);

export async function POST(request, { params }) {
  const { userId, dashboardId } = await params;
  return handlers.bootstrap(request, { userId, dashboardId });
}

export async function PATCH(request, { params }) {
  const { userId, dashboardId } = await params;
  return handlers.updateLayout(request, { userId, dashboardId });
}
```
</details>

<details>
<summary><b>Express</b></summary>

```ts
const handlers = createDashboardHandlers(options);

router.post("/api/users/:userId/dashboards/:dashboardId", async (req, res) => {
  const request = new Request(
    `http://host${req.originalUrl}`,
    { method: "POST", body: JSON.stringify(req.body), headers: req.headers },
  );
  const response = await handlers.bootstrap(request, req.params);
  res.status(response.status).json(await response.json());
});
```
</details>

<details>
<summary><b>TanStack Start / Hono / other Fetch servers</b></summary>

```ts
const handlers = createDashboardHandlers(options);

app.post("/api/users/:userId/dashboards/:dashboardId", async (c) => {
  const request = c.req.raw;
  return handlers.bootstrap(request, c.req.param());
});
```
</details>

### Required interface: `DashboardRepository`

Implement this interface for your database:

```ts
interface DashboardRepository {
  bootstrap(userId: string, seed: DashboardSeed): Promise<PersistedDashboard>;
  loadDashboard(dashboardId: string): Promise<PersistedDashboard | null>;
  updateLayout(
    dashboardId: string,
    revision: string,
    cards: DashboardCardLayout[],
  ): Promise<PersistedDashboard>;
  updateCardName(cardId: string, name: string): Promise<PersistedDashboardCard>;
  addCard(dashboardId: string, revision: string, card: {
    name: string;
    visualization: VisualizationType;
    sourceQuery: string;
    layout: DashboardCardLayout;
    deeplink?: CardDeeplinkConfig;
  }): Promise<PersistedDashboard>;
  removeCard(cardId: string, revision: string): Promise<PersistedDashboardCard>;
  findOwnedCard(cardId: string, dashboardId: string): Promise<PersistedDashboardCard | null>;
}
```

The canonical reference implementation is `SqliteDashboardRepository` in `apps/web/server/dashboard/repository.ts`.

### `DashboardHandlerOptions`

| Option | Type | Description |
|--------|------|-------------|
| `repository` | `DashboardRepository` | Persistence layer |
| `cardLibrary` | `CardLibraryTemplate[]` | Available card templates |
| `defaultDashboard` | `(params: { userId: string }) => DashboardSeed` | Generates the initial dashboard for a new user |
| `resolveCardData` | `(input: CardDataResolverInput) => Promise<PanelCardDataResponse>` | Resolves a card's source query into visualisation data |
| `urls?` | `{ consumerApiBaseUrl?: string; gridframeApiBaseUrl?: string }` | URL prefixes for serialisation |

### Handler reference

| Handler | Route | Description |
|---------|-------|-------------|
| `bootstrap(request, identity)` | `POST /.../dashboards` | Create or load a user's default/selected dashboard |
| `updateLayout(request, identity)` | `PATCH .../layout` | Persist a complete card layout (revision-gated) |
| `updateCard(request, identity)` | `PATCH .../cards/:cardId` | Rename a card (revision-gated) |
| `listCardLibrary(request, identity)` | `GET .../card-library` | List all templates with install status |
| `addCard(request, identity)` | `POST .../cards` | Add a card from the library (revision-gated, first-fit placement) |
| `removeCard(request, identity)` | `DELETE .../cards/:cardId` | Remove a card (revision-gated) |
| `fetchCardData(request, identity)` | `GET .../cards/:cardId/data` | Resolve card data via `resolveCardData` |

## Client API

`@gridframe/client` exports these functions:

```ts
bootstrapDashboard(options)    // POST /users/:userId/dashboards/bootstrap
fetchDashboardCardData(options) // GET .../cards/:cardId/data
updateDashboardLayout(options)  // PATCH .../layout
updateDashboardCard(options)    // PATCH .../cards/:cardId
listCardLibrary(options)        // GET .../card-library
addDashboardCard(options)       // POST .../cards
removeDashboardCard(options)    // DELETE .../cards/:cardId
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

| Component | Props | Description |
|-----------|-------|-------------|
| `PanelDashboard` | `config: PanelDashboardConfig` (static) or `dashboard: ApiPanelDashboardConfig` (managed) | Root dashboard component. Owns its TanStack Query client. |
| `CardVisualization` | `data: PanelCardPayload` | Renders the correct chart/metric/table for the given payload |
| `SourceDataTable` | `data: SourceDataTable` | Renders a source data table with column alignment |
| `DashboardDrillDown` | drill-down params | Full page: bootstraps dashboard, fetches card with source data, renders visualisation + table |

## Run the complete example

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The example redirects to an API-managed Dashboard for `example-user`. Move or resize Cards, rename one, open the Card library to add any supported Visualisation, remove and re-add templates, and follow any Card footer Deeplink to inspect the Visualisation and the exact normalised source records used to produce it.

The example stores its SQLite database at `.data/gridframe.sqlite`. Remove that file to reset the fake users and their Dashboards.

## Verify

```bash
pnpm check-types
pnpm lint
pnpm test
pnpm build
```

## Workspace

- `packages/core` — canonical contracts, schemas, and Dashboard layout validation
- `packages/client` — typed Dashboard API client
- `packages/react` — Dashboard UI plus shared `CardVisualisation` and `SourceDataTable`
- `packages/server` — framework-neutral Dashboard API handlers and repository contracts
- `packages/ui` — shadcn/ui-style presentational primitives
- `apps/web` — complete Next.js, SQLite, and faker-backed consumer example
- `apps/docs` — documentation application
