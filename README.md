<img width="2172" height="724" alt="ChatGPT Image Jul 11, 2026, 04_00_57 PM" src="https://github.com/user-attachments/assets/e0d193ab-5a11-4b2a-8ab1-0205f2de72a4" />

# Gridframe

**A toolkit for building complex, customisable dashboards without rebuilding the same dashboard plumbing every time.**

Gridframe is a dashboard framework and companion service layer for building rich, user-configurable dashboards in modern frontend applications.

It gives you reusable dashboard components for the UI, plus a backend API layer for the product features that usually grow around dashboards: saved layouts, user customisation, sharing, reporting, permissions, exports, and more.

> Dashboards should be product features, not one-off engineering projects.

## What works today

- Static Dashboard configs and API-managed, user-owned Dashboards
- Metric, area, bar, line, pie, radar, radial, and table Visualizations
- Responsive drag and resize, inline Card renaming, and persisted revisions
- A trusted Card library with transactional add/remove and first-fit placement
- Server-mediated Card Queries that keep consumer URLs out of the browser
- Owner-scoped Card Deeplinks with a shared Visualization and source-data table
- Loading, empty, not-found, error, retry, rollback, and revision-conflict states

## Run the complete example

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The example redirects to an API-managed Dashboard for `example-user`. Move or resize Cards, rename one, open the Card library to add any supported Visualization, remove and re-add templates, and follow any Card footer Deeplink to inspect the Visualization and the exact normalized source records used to produce it.

The example stores its SQLite database at `.data/gridframe.sqlite`. Remove that file to reset the fake users and their Dashboards.

## React API

Static mode preserves caller-owned Queries and Deeplinks:

```tsx
<PanelDashboard config={config} />
```

API-managed mode bootstraps a user-owned Dashboard and enables persistence, the Card library, mediated Queries, and generated Deeplinks:

```tsx
<PanelDashboard
  dashboard={{
    userId: "example-user",
    dashboardId,
    onDashboardChange: setDashboardId,
  }}
/>
```

`PanelDashboard` owns its TanStack Query client in both modes. Import `@gridframe/react/styles.css` once in the host application.

## Server API

API-managed mode expects a companion backend. Reusable backend behavior now lives in `@gridframe/server` as Fetch-native handlers:

```ts
import { createDashboardHandlers } from "@gridframe/server";

const handlers = createDashboardHandlers({
  repository,
  cardLibrary,
  defaultDashboard: ({ userId }) => dashboardSeedFor(userId),
  resolveCardData: async ({ card }) => loadCardData(card),
});
```

Consumers mount those handlers in their framework of choice. The Next.js example in `apps/web` is the canonical adapter; Express, TanStack Start, and Vite-style servers only need to pass a Fetch `Request` plus route params. Host applications remain responsible for authorizing access to the supplied `userId` and Dashboard IDs.

## Workspace

- `packages/core` — canonical contracts, schemas, and Dashboard layout validation
- `packages/client` — typed Dashboard API client
- `packages/react` — Dashboard UI plus shared `CardVisualization` and `SourceDataTable`
- `packages/server` — framework-neutral Dashboard API handlers and repository contracts
- `apps/web` — complete Next.js, SQLite, and faker-backed consumer example
- `apps/docs` — documentation application

## Verify

```bash
pnpm check-types
pnpm lint
pnpm test
pnpm build
```
