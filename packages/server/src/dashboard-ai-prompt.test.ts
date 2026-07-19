import { describe, expect, it } from "vitest";

import { buildDashboardProposalPrompt } from "./dashboard-ai-prompt";

describe("buildDashboardProposalPrompt", () => {
  it("excludes existing field configuration outside the authorized safe list", () => {
    const prompt = buildDashboardProposalPrompt({
      prompt: "Update this Dashboard",
      aiCardLibrary: [],
      dataCatalogue: [
        {
          key: "region",
          label: "Region",
          type: "category",
          filterable: true,
        },
      ],
      dashboard: {
        id: "dashboard-1",
        ownerUserId: "user-1",
        title: "Sales",
        isDefault: true,
        revision: 2,
        globalFilters: [
          {
            id: "region",
            field: "region",
            operator: "equals",
            value: "Europe",
          },
          {
            id: "email",
            field: "customer_email",
            operator: "equals",
            value: "private@example.test",
          },
        ],
        cards: [
          {
            id: "card-1",
            dashboardId: "dashboard-1",
            libraryItemKey: "orders",
            name: "Orders",
            visualization: "table",
            data: {
              dimensions: ["region", "customer_email"],
              filters: [
                {
                  field: "customer_email",
                  operator: "equals",
                  value: "private@example.test",
                },
              ],
            },
            layout: { x: 0, y: 0, width: 4, height: 4 },
            sortOrder: 0,
          },
        ],
      },
    });

    expect(prompt).toContain("Europe");
    expect(prompt).not.toContain("customer_email");
    expect(prompt).not.toContain("private@example.test");
  });
});
