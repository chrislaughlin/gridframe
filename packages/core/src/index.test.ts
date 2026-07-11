import { describe, expect, it } from "vitest";

import {
  DashboardBootstrapResponseSchema,
  PanelCardDataResponseSchema,
  validateDashboardLayout,
} from "./index";

const barCardData = {
  visualization: "bar",
  indexKey: "month",
  data: [{ month: "January", revenue: 1200 }],
  series: [
    {
      key: "revenue",
      label: "Revenue",
      color: "var(--chart-1)",
    },
  ],
} as const;

describe("PanelCardDataResponseSchema", () => {
  it("accepts a valid Visualization payload with source data", () => {
    const response = {
      status: "success",
      data: barCardData,
      sourceData: {
        columns: [{ key: "revenue", label: "Revenue", align: "right" }],
        rows: [{ revenue: 1200 }],
      },
    };

    expect(PanelCardDataResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects a malformed Visualization payload", () => {
    const response = {
      status: "success",
      data: {
        ...barCardData,
        data: [{ month: { nested: "not a chart value" }, revenue: 1200 }],
      },
    };

    expect(() => PanelCardDataResponseSchema.parse(response)).toThrow();
  });
});

describe("DashboardBootstrapResponseSchema", () => {
  it("accepts an API-managed Dashboard with persisted layout", () => {
    const response = {
      dashboards: [{ id: "dashboard-1", title: "Operations", isDefault: true }],
      dashboard: {
        id: "dashboard-1",
        revision: "1",
        config: {
          title: "Operations",
          cards: [
            {
              id: "card-1",
              name: "Revenue",
              visualization: "bar",
              query:
                "/api/gridframe/users/user-1/dashboards/dashboard-1/cards/card-1/data",
              layout: { x: 0, y: 0, width: 2, height: 4 },
            },
          ],
        },
      },
    };

    expect(DashboardBootstrapResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects a Dashboard document without Card layout", () => {
    const response = {
      dashboards: [{ id: "dashboard-1", title: "Operations", isDefault: true }],
      dashboard: {
        id: "dashboard-1",
        revision: "1",
        config: {
          title: "Operations",
          cards: [
            {
              id: "card-1",
              name: "Revenue",
              visualization: "bar",
              query: "/api/cards/card-1/data",
            },
          ],
        },
      },
    };

    expect(() => DashboardBootstrapResponseSchema.parse(response)).toThrow();
  });
});

describe("validateDashboardLayout", () => {
  it("accepts exact, non-overlapping Card membership", () => {
    expect(
      validateDashboardLayout(
        [
          { id: "card-1", x: 0, y: 0, width: 2, height: 2 },
          { id: "card-2", x: 2, y: 0, width: 2, height: 2 },
        ],
        ["card-1", "card-2"],
      ),
    ).toEqual({ valid: true });
  });

  it("rejects duplicate, missing, overlapping, and out-of-bounds Cards", () => {
    const result = validateDashboardLayout(
      [
        { id: "card-1", x: 0, y: 0, width: 3, height: 2 },
        { id: "card-1", x: 2, y: 0, width: 3, height: 2 },
      ],
      ["card-1", "card-2"],
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "Card IDs must be unique",
          "Layout must contain exactly the Dashboard's Cards",
          "Card card-1 extends beyond the 4-column grid",
          "Cards card-1 and card-1 overlap",
        ]),
      );
    }
  });
});
