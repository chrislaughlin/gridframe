# Gridframe Setup Contracts

## Card definitions

Use the registry exported by `@gridframe/server`:

```ts
const cards = defineCards({
  "total-revenue": {
    name: "Total revenue",
    description: "Revenue across completed orders.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    resolve: async ({ userId }) => {
      const value = await orders.totalRevenueForUser(userId);
      return {
        status: "success",
        data: { visualization: "metric", value, label: "Revenue" },
      };
    },
  },
});
```

Use `cards.cardLibrary` and `cards.resolveCardData` directly in `createDashboardHandlers`. Reference seed keys through `cards.definitions["total-revenue"].key`; do not duplicate string keys across files.

## Dashboard seed

Create one `DashboardSeed`. The seed is applied only when the repository bootstraps a user without a Dashboard. It is not a migration mechanism for existing Dashboards.

The first setup must contain one Card backed by real application data. Give the seed Card an explicit valid 4-column layout.

## Handler surface

Mount all seven operations at paths compatible with `@gridframe/client`:

| Method | Relative path                                               | Handler           |
| ------ | ----------------------------------------------------------- | ----------------- |
| POST   | `/users/:userId/dashboards/bootstrap`                       | `bootstrap`       |
| PATCH  | `/users/:userId/dashboards/:dashboardId/layout`             | `updateLayout`    |
| PATCH  | `/users/:userId/dashboards/:dashboardId/cards/:cardId`      | `updateCard`      |
| DELETE | same Card path                                              | `removeCard`      |
| GET    | `/users/:userId/dashboards/:dashboardId/card-library`       | `listCardLibrary` |
| POST   | `/users/:userId/dashboards/:dashboardId/cards`              | `addCard`         |
| GET    | `/users/:userId/dashboards/:dashboardId/cards/:cardId/data` | `fetchCardData`   |

## Manifest

Write `gridframe.json` in the integrated application root. Resolve all paths relative to that file.

```json
{
  "$schema": "https://raw.githubusercontent.com/chrislaughlin/gridframe/main/skills/gridframe.schema.json",
  "version": 1,
  "mode": "api-managed",
  "paths": {
    "cardDefinitions": "src/gridframe/cards.ts",
    "dashboardSeed": "src/gridframe/dashboard-seed.ts",
    "handlers": "src/gridframe/handlers.ts",
    "repository": "src/gridframe/repository.ts",
    "dashboardComponent": "src/dashboard/dashboard.tsx",
    "routeMounts": ["src/routes/gridframe.ts"]
  }
}
```

In a monorepo, place one manifest beside each integrated application. Paths may point into shared workspace packages. If discovery finds multiple manifests, require the caller to select one.
