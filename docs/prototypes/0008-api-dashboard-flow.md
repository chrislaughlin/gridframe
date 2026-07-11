# API-backed Dashboard interaction sequence

Status: validated sequence sketch

Date: 2026-07-11

Issue: [gridframe#8](https://github.com/chrislaughlin/gridframe/issues/8)

## Question

Do the contracts from issues #2–#7 form one coherent interaction flow in which `PanelDashboard` loads a user-owned Dashboard, obtains Card data only through the Dashboard API, persists Dashboard config edits, adds and removes Cards from a library, and opens a drill-down with both the Visualization and its source data?

## Verdict

Yes. The flow works with one important implementation rule: an API-managed Dashboard config is a serialized view, not a direct dump of database rows. The server must replace every persisted source Query and Deeplink destination with owner-scoped Gridframe URLs before the config reaches the browser.

The first implementation can remain an example-app service. Public packages own transport-neutral contracts, the HTTP client, and React behavior; SQLite, seed templates, the trusted Card library, consumer forwarding, and Next.js routes stay in `apps/web`.

## Page routes

```text
/gridframe/users/:userId/dashboards
/gridframe/users/:userId/dashboards/:dashboardId
/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId
```

The first route bootstraps the default Dashboard. The second selects an explicit Dashboard without persisting that selection. The third is the Card Deeplink drill-down. `onDashboardChange` navigates between the first two route shapes.

## End-to-end sequence

```mermaid
sequenceDiagram
    actor User
    participant Page as Next.js Dashboard page
    participant React as PanelDashboard
    participant Client as @gridframe/client
    participant API as Dashboard API
    participant Repo as DashboardRepository
    participant DB as SQLite
    participant Consumer as Faker consumer API

    User->>Page: Open user Dashboard route
    Page->>React: userId, optional dashboardId, apiBaseUrl
    React->>Client: bootstrapDashboard(userId, dashboardId?)
    Client->>API: POST /users/:userId/dashboards/bootstrap
    API->>Repo: bootstrap(ownerId, dashboardId?)
    Repo->>DB: Load selected/default Dashboard
    alt No default Dashboard exists
        Repo->>DB: Transaction: insert default + seeded Cards
    end
    DB-->>Repo: Dashboard aggregate + revision
    Repo-->>API: Persisted aggregate
    API->>API: Serialize proxy Queries and internal Deeplinks
    API-->>Client: summaries + DashboardDocument
    Client-->>React: validated bootstrap response
    React-->>User: Dashboard selector, grid, Card skeletons

    par Every visible Card
        React->>Client: fetchDashboardCardData(identity)
        Client->>API: GET /users/:userId/dashboards/:dashboardId/cards/:cardId/data
        API->>Repo: Resolve owned Card and source Query
        Repo->>DB: Load Card source config
        API->>Consumer: GET configured relative source Query
        Consumer-->>API: Deterministic faker source records
        API->>API: Validate and adapt Visualization payload
        API-->>Client: PanelCardDataResponse
        Client-->>React: Validated Card response
        React-->>User: Visualization / empty / retryable error
    end

    User->>React: Finish Card drag or resize
    React-->>User: Apply optimistic complete layout
    React->>Client: updateDashboardLayout(revision, all rectangles)
    Client->>API: PATCH /users/:userId/dashboards/:dashboardId/layout
    API->>Repo: Validate ownership, revision, IDs, geometry
    Repo->>DB: Transaction: update layout + increment revision
    DB-->>Repo: Updated aggregate
    Repo-->>API: Updated aggregate
    API-->>Client: Updated DashboardDocument
    Client-->>React: Validated DashboardDocument

    User->>React: Save Card name
    React-->>User: Apply optimistic name
    React->>Client: updateDashboardCard(revision, cardId, name)
    Client->>API: PATCH /users/:userId/dashboards/:dashboardId/cards/:cardId
    API->>Repo: Validate ownership and revision; update name
    Repo->>DB: Transaction: update Card + increment revision
    DB-->>Repo: Updated aggregate
    Repo-->>API: Updated aggregate
    API-->>Client: Updated DashboardDocument
    Client-->>React: Commit or apply shared rollback/conflict flow

    User->>React: Add Card-library item
    React->>Client: addDashboardCard(revision, libraryItemKey)
    Client->>API: POST /users/:userId/dashboards/:dashboardId/cards
    API->>API: Resolve trusted template and first free position
    API->>Repo: Insert owned Card with fresh UUID
    Repo->>DB: Transaction: insert Card + increment revision
    DB-->>Repo: Updated aggregate
    Repo-->>API: Updated aggregate + library state
    API-->>Client: Updated document + library state
    Client-->>React: Validated mutation response
    React->>Client: Fetch new Card data through Dashboard API

    User->>React: Remove Card
    React->>Client: removeDashboardCard(revision, cardId)
    Client->>API: DELETE /users/:userId/dashboards/:dashboardId/cards/:cardId
    API->>Repo: Delete owned Card
    Repo->>DB: Transaction: delete + increment revision
    DB-->>Repo: Updated aggregate
    Repo-->>API: Updated aggregate + library state
    API-->>Client: Updated document + library state
    Client-->>React: Validated mutation response

    User->>Page: Click Card footer Deeplink
    par Metadata
        Page->>Client: Bootstrap selected Dashboard; locate Card
        Client->>API: POST /users/:userId/dashboards/bootstrap
        API->>Repo: Load owned Dashboard aggregate
        Repo-->>API: Dashboard aggregate or not found
        API-->>Client: DashboardDocument or 404
        Client-->>Page: Validated metadata or not-found
    and Visualization and source data
        Page->>Client: Fetch Card data with includeSource=true
        Client->>API: GET .../cards/:cardId/data?includeSource=true
        API->>Consumer: Execute the same persisted source Query once
        Consumer-->>API: Source records
        API->>API: Derive Visualization payload + source table
        API-->>Client: Validated success response with sourceData
        Client-->>Page: Card data or typed error
    end
    Page->>Page: Metadata 404/missing Card wins as not-found
    Page-->>User: Shared Visualization + source data table
```

## React state model

```text
bootstrap
  pending -> ready
  pending -> failed -> retrying -> ready|failed

Dashboard selection
  ready(A) -> switching(A→B) -> ready(B)
  ready(A) -> switching(A→B) -> ready(A) + error

Dashboard config mutation
  ready(revision N)
    -> optimistic + mutation pending
    -> success(revision N+1)
    -> ordinary failure + rollback(revision N)
    -> revision conflict + refetch(server revision)

Card data
  pending -> success | empty | failed
  failed -> retrying -> success | empty | failed
```

Only one Dashboard config mutation may be pending. Card data queries remain independently concurrent. A Dashboard switch keeps the previous Dashboard visible while pending, but mutation controls are disabled during the switch. Card rename uses the same optimistic, rollback, and revision-conflict transition as layout edits.

## Serialized Dashboard example

The database row retains a server-only source Query and Deeplink settings:

```ts
{
  id: "card-uuid",
  dashboardId: "dashboard-uuid",
  libraryItemKey: "revenue-by-region",
  sourceQuery: "/api/consumer/cards/revenue-by-region",
  deeplinkEnabled: true,
  deeplinkLabel: "View source data"
}
```

The browser receives only mediated URLs:

```ts
{
  id: "card-uuid",
  name: "Revenue by region",
  visualization: "bar",
  query: "/api/gridframe/users/user-123/dashboards/dashboard-uuid/cards/card-uuid/data",
  deeplink: {
    href: "/gridframe/users/user-123/dashboards/dashboard-uuid/cards/card-uuid",
    label: "View source data"
  },
  layout: { x: 0, y: 0, width: 2, height: 4 }
}
```

## Endpoint inventory

| Method   | Route                                                                     | Purpose                                                       |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `POST`   | `/api/gridframe/users/:userId/dashboards/bootstrap`                       | Find/create default or load requested Dashboard and summaries |
| `PATCH`  | `/api/gridframe/users/:userId/dashboards/:dashboardId/layout`             | Atomically persist the complete layout                        |
| `PATCH`  | `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId`      | Persist a Card rename                                         |
| `GET`    | `/api/gridframe/users/:userId/dashboards/:dashboardId/card-library`       | List trusted templates with installed state                   |
| `POST`   | `/api/gridframe/users/:userId/dashboards/:dashboardId/cards`              | Add one trusted template as an owned Card                     |
| `DELETE` | `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId`      | Delete an owned Card and its edits                            |
| `GET`    | `/api/gridframe/users/:userId/dashboards/:dashboardId/cards/:cardId/data` | Execute the persisted source Query through the Dashboard API  |
| `GET`    | `/api/consumer/cards/:sourceKey`                                          | Return deterministic faker source records inside the example  |

## Implementation boundaries

```text
@gridframe/core
  Canonical Dashboard/Card/API types
  Runtime response validation schemas
  Four-column v1 layout constant and pure geometry validation

@gridframe/client
  Typed fetch functions
  URL construction and encoding
  Abort signals and typed transport errors

@gridframe/react
  Static/API-managed PanelDashboard modes
  Internal TanStack Query client
  Dashboard selector and Card library controls
  Optimistic mutation state
  Shared CardVisualization and SourceDataTable

apps/web
  Next.js pages and Route Handlers
  better-sqlite3 repository and migrations
  Default Dashboard seed and trusted Card library
  Source Query forwarding/adapter
  Deterministic faker consumer API
```

The forwarding adapter accepts only relative GET paths under its configured consumer base URL. It rejects absolute or protocol-relative URLs, traversal outside the base path, fragments, and other methods before making a request. It applies a short server-side timeout, forwards an abort signal, and performs no server-side retry; TanStack Query remains the single retry owner.

Runtime validation belongs in `@gridframe/core`. Use one schema implementation as the source of inferred TypeScript types rather than maintaining separate handwritten types and validators. Select and pin the validation dependency during implementation; it must support discriminated unions and must not import server-only code.

## Worked edge cases

### Concurrent first bootstrap

Two requests see no default. Both attempt the seed transaction. The partial unique index permits one default; the loser catches that constraint, reloads the winner, and returns it. Both callers receive the same Dashboard ID.

### Compaction moves several Cards

React Grid Layout changes three rectangles after one drag. The client submits every Card rectangle. The server validates exact membership and the non-overlapping four-column result, then updates all rows under one revision.

### Stale layout edit

The request submits revision `4`, while SQLite contains `5`. No rows change. The API returns `409 REVISION_CONFLICT`; the client refetches and replaces its optimistic layout with revision `5`.

### Removed Card still open in another tab

The drill-down or data endpoint resolves the owner-scoped Card after it has been deleted and returns the same not-found response as an unknown/non-owned identity. No persisted source Query executes.

### Empty Dashboard

Removing the final Card leaves a valid Dashboard at the next revision. The UI renders the Card-library empty state; adding a template creates a new Card UUID and places it at `(0, 0)`.

## Decisions closed by the sketch

- The canonical Dashboard page route is explicit and can represent default or selected Dashboard state without a persisted “current Dashboard.”
- API serialization, rather than the database model, owns proxy Query and Deeplink URL generation.
- Drill-down metadata reuses bootstrap; no duplicate Card-detail metadata endpoint is required.
- The Card data adapter executes once when source data is requested and derives both outputs from that result.
- Dashboard mutations are serialized; Card data requests remain concurrent.
- The default seed should be intentionally small: one metric, one chart, and one table Card. The Card library exposes the broader showcase catalog.
- Raise the repository Node engine to at least `20.9` in the implementation because Next.js 16 already requires it.

## Deferred intentionally

- Production authentication/authorization and removal of user IDs from URLs.
- Sharing, exports, reporting, pagination, and production persistence.
- Multiple instances of the same Card-library template.
- Configurable/responsive column contracts.
- Persisted current-Dashboard preference.
- Hosted or multi-instance database selection.

None of these deferred items blocks the first API-backed example.
