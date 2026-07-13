import { describe, expect, expectTypeOf, it } from "vitest";

import { defineCards, type CardDataResolverInput } from ".";

function resolverInput(
  libraryItemKey: string | undefined = "revenue",
  visualization: "metric" | "bar" = "metric",
): CardDataResolverInput {
  return {
    userId: "user-1",
    dashboardId: "dashboard-1",
    cardId: "card-1",
    request: new Request("http://example.test/data"),
    card: {
      id: "card-1",
      dashboardId: "dashboard-1",
      libraryItemKey,
      name: "Revenue",
      visualization,
      layout: { x: 0, y: 0, width: 1, height: 2 },
      sortOrder: 0,
    },
  };
}

describe("defineCards", () => {
  it("derives the Card library while preserving definition keys and fields", () => {
    const cards = defineCards({
      revenue: {
        name: "Revenue",
        description: "Revenue metric",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        deeplinkLabel: "View revenue",
        sourceName: "orders",
        resolve: () => ({
          status: "success",
          data: { visualization: "metric", value: 42, label: "Revenue" },
        }),
      },
    });

    expect(cards.cardLibrary).toEqual([
      {
        key: "revenue",
        name: "Revenue",
        description: "Revenue metric",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        deeplinkLabel: "View revenue",
      },
    ]);
    expect(cards.definitions.revenue).toMatchObject({
      key: "revenue",
      sourceName: "orders",
    });
    expectTypeOf(cards.definitions.revenue.key).toEqualTypeOf<"revenue">();
    expectTypeOf(
      cards.definitions.revenue.sourceName,
    ).toEqualTypeOf<"orders">();
  });

  it("dispatches synchronous and asynchronous Card resolvers by definition key", async () => {
    const cards = defineCards({
      revenue: {
        name: "Revenue",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        resolve: () => ({
          status: "success",
          data: { visualization: "metric", value: 42 },
        }),
      },
      orders: {
        name: "Orders",
        visualization: "bar",
        defaultLayout: { width: 3, height: 4 },
        resolve: async () => ({
          status: "success",
          data: {
            visualization: "bar",
            indexKey: "month",
            data: [{ month: "Jan", orders: 12 }],
            series: [
              {
                key: "orders",
                label: "Orders",
                color: "var(--chart-1)",
              },
            ],
          },
        }),
      },
    });

    await expect(cards.resolveCardData(resolverInput())).resolves.toMatchObject(
      {
        status: "success",
        data: { visualization: "metric", value: 42 },
      },
    );
    await expect(
      cards.resolveCardData(resolverInput("orders", "bar")),
    ).resolves.toMatchObject({
      status: "success",
      data: { visualization: "bar" },
    });
  });

  it("rejects invalid Card library metadata when the registry is defined", () => {
    expect(() =>
      defineCards({
        oversized: {
          name: "Oversized",
          visualization: "bar",
          defaultLayout: { width: 5, height: 4 },
          resolve: () => ({ status: "empty" }),
        },
      }),
    ).toThrow("Card definition oversized has an invalid default layout");

    expect(() =>
      defineCards({
        revenue: {
          name: "Revenue",
          description: 42 as never,
          visualization: "metric",
          defaultLayout: { width: 1, height: 2 },
          resolve: () => ({ status: "empty" }),
        },
      }),
    ).toThrow("Card definition revenue has invalid metadata");
  });

  it("rejects missing and mismatched Card definitions", async () => {
    const cards = defineCards({
      revenue: {
        name: "Revenue",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        resolve: () => ({ status: "empty" }),
      },
    });

    await expect(
      cards.resolveCardData(resolverInput("missing")),
    ).rejects.toThrow("Card definition missing is not available");
    await expect(
      cards.resolveCardData(resolverInput("revenue", "bar")),
    ).rejects.toThrow("Card definition revenue does not match the Card");
  });

  it("rejects invalid and Visualization-mismatched resolver responses", async () => {
    const invalid = defineCards({
      revenue: {
        name: "Revenue",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        resolve: () => ({ status: "success", data: undefined }) as never,
      },
    });
    const mismatched = defineCards({
      revenue: {
        name: "Revenue",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
        resolve: () => ({
          status: "success",
          data: {
            visualization: "bar",
            indexKey: "month",
            data: [],
            series: [],
          },
        }),
      },
    });

    await expect(invalid.resolveCardData(resolverInput())).rejects.toThrow();
    await expect(mismatched.resolveCardData(resolverInput())).rejects.toThrow(
      "Card definition revenue returned bar data for a metric Card",
    );
  });
});
