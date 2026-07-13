# Card Definition Pattern

Each entry in `defineCards` owns the Card library metadata and its data resolver. The object key is the stable library identity; never derive it from a mutable display name.

```ts
const cards = defineCards({
  "revenue-by-region": {
    name: "Revenue by region",
    description: "Completed order revenue grouped by region.",
    visualization: "bar",
    defaultLayout: { width: 3, height: 4 },
    resolve: async ({ userId }) => {
      const rows = await orders.revenueByRegion(userId);
      if (rows.length === 0) return { status: "empty" };
      return {
        status: "success",
        data: {
          visualization: "bar",
          indexKey: "region",
          data: rows,
          series: [
            {
              key: "revenue",
              label: "Revenue",
              color: "var(--chart-1)",
            },
          ],
        },
      };
    },
  },
});
```

Use the authenticated `userId` from the resolver input. Keep secrets and internal service locations on the server. Return `empty` only for a valid query with no records; let unexpected failures throw.

For drill-downs, set `deeplinkLabel` and include `sourceData` on successful responses when `new URL(request.url).searchParams.get("includeSource") === "true"`. Normalize values to strings, numbers, or null and provide stable table columns.

Default sizes on the 4-column grid:

- Metric: `1 x 2`
- Table: `4 x 4`
- Category or time-series chart: `2 x 4`; use `3 x 4` when labels or series need width

The Card becomes available through the derived library automatically. Do not add it to the Dashboard seed unless explicitly requested.
