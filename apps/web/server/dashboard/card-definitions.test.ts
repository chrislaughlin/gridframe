import { describe, expect, it } from "vitest";
import type {
  DashboardCardDataConfig,
  DashboardGlobalFilter,
} from "@gridframe/core";

import { cardDefinitions, resolveExampleCardData } from "./card-definitions";

describe("AI-configured example Card resolvers", () => {
  it("honours a 12-month time range", async () => {
    const result = await resolve("revenue-trend", {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      time: {
        field: "created_at",
        range: "last 12 months",
        grain: "month",
      },
    });

    expect(result).toMatchObject({
      status: "success",
      data: { visualization: "area" },
    });
    if (result.status !== "success" || result.data.visualization !== "area") {
      throw new Error("Expected area data");
    }
    expect(result.data.data).toHaveLength(12);
  });

  it.each([
    ["hour", "last 6 hours", /T\d{2}:00$/],
    ["day", "last 6 days", /^\d{4}-\d{2}-\d{2}$/],
    ["week", "last 6 weeks", /^\d{4}-\d{2}-\d{2}$/],
    ["month", "last 6 months", /^\d{4}-\d{2}$/],
    ["quarter", "last 6 quarters", /^\d{4}-Q[1-4]$/],
    ["year", "last 6 years", /^\d{4}$/],
  ] as const)("honours the %s time grain", async (grain, range, label) => {
    const result = await resolve("revenue-trend", {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      time: { field: "created_at", range, grain },
    });

    if (result.status !== "success" || result.data.visualization !== "area") {
      throw new Error("Expected area data");
    }
    expect(result.data.data).toHaveLength(6);
    expect(
      result.data.data.every((row) => label.test(String(row.created_at))),
    ).toBe(true);
  });

  it.each([
    ["quarter", 4],
    ["month", 12],
  ] as const)(
    "converts a yearly range to exact %s periods",
    async (grain, expectedCount) => {
      const result = await resolve("revenue-trend", {
        metrics: [{ field: "revenue", aggregation: "sum" }],
        time: { field: "created_at", range: "last 1 year", grain },
      });

      if (result.status !== "success" || result.data.visualization !== "area") {
        throw new Error("Expected area data");
      }
      expect(result.data.data).toHaveLength(expectedCount);
    },
  );

  it("uses the configured metric and dimension for category Cards", async () => {
    const result = await resolve("channel-share", {
      metrics: [{ field: "order_id", aggregation: "count", alias: "orders" }],
      dimensions: ["region"],
    });

    if (result.status !== "success" || result.data.visualization !== "pie") {
      throw new Error("Expected pie data");
    }
    expect(result.data.nameKey).toBe("region");
    expect(result.data.valueKey).toBe("orders");
    expect(result.data.data.map((row) => row.region)).toEqual([
      "North",
      "South",
      "East",
      "West",
    ]);
    expect(
      result.data.data.every((row) => typeof row.orders === "number"),
    ).toBe(true);
  });

  it("honours metric sorting and a top-10 limit", async () => {
    const result = await resolve("top-products", {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      dimensions: ["product"],
      sort: [{ field: "revenue", direction: "desc" }],
      limit: 10,
    });

    if (result.status !== "success" || result.data.visualization !== "bar") {
      throw new Error("Expected bar data");
    }
    expect(result.data.data).toHaveLength(10);
    expect(result.data.data.map((row) => Number(row.revenue))).toEqual(
      [...result.data.data]
        .map((row) => Number(row.revenue))
        .sort((left, right) => right - left),
    );
  });

  it("counts orders instead of summing identifiers", async () => {
    const result = await resolve(
      "total-orders",
      { metrics: [{ field: "order_id", aggregation: "count" }] },
      [],
      true,
    );

    if (result.status !== "success" || result.data.visualization !== "metric") {
      throw new Error("Expected metric data");
    }
    expect(typeof result.data.value).toBe("number");
    expect(
      result.sourceData?.rows.every((row) => typeof row.order_id === "string"),
    ).toBe(true);
  });

  it("applies a Dashboard-level region filter", async () => {
    const result = await resolve(
      "recent-orders",
      {
        dimensions: ["order_id", "region", "order_value"],
        limit: 20,
      },
      [
        {
          id: "region",
          field: "region",
          operator: "equals",
          value: "North",
        },
      ],
      true,
    );

    if (result.status !== "success") throw new Error("Expected table data");
    expect(result.sourceData?.rows.length).toBeGreaterThan(0);
    expect(result.sourceData?.rows.every((row) => row.region === "North")).toBe(
      true,
    );
  });
});

async function resolve(
  key: keyof typeof cardDefinitions,
  data: DashboardCardDataConfig,
  globalFilters: DashboardGlobalFilter[] = [],
  includeSource = false,
) {
  const definition = cardDefinitions[key];
  return resolveExampleCardData({
    userId: "user-1",
    dashboardId: "dashboard-1",
    cardId: `card-${key}`,
    card: {
      id: `card-${key}`,
      dashboardId: "dashboard-1",
      libraryItemKey: key,
      name: definition.name,
      visualization: definition.visualization,
      data,
      layout: { x: 0, y: 0, ...definition.defaultLayout },
      sortOrder: 0,
    },
    globalFilters,
    request: new Request(
      `http://localhost/card-data${includeSource ? "?includeSource=true" : ""}`,
    ),
  });
}
