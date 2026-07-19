import { describe, expect, it } from "vitest";

import {
  CreateDashboardProposalRequestSchema,
  DashboardProposalSchema,
  ProposedCardSchema,
} from ".";

describe("DashboardProposalSchema", () => {
  it("accepts a structured proposal made only from explicit actions", () => {
    const proposal = DashboardProposalSchema.parse({
      version: 1,
      title: "Ecommerce overview",
      intent: {
        domain: "ecommerce",
        objective: "Track sales performance",
        audience: "Ecommerce manager",
      },
      actions: [
        {
          type: "createDashboard",
          title: "Ecommerce overview",
          description: "Sales and order health",
        },
        {
          type: "addCard",
          card: {
            cardKey: "total-revenue",
            title: "Total revenue",
            data: {
              metrics: [{ field: "revenue", aggregation: "sum" }],
              filters: [
                {
                  field: "region",
                  operator: "equals",
                  value: "Europe",
                },
              ],
            },
            layout: { x: 0, y: 0, width: 1, height: 2 },
          },
        },
      ],
      assumptions: ["Revenue is reported in the account currency."],
      missingInformation: [],
      explanation: "Headline revenue appears first.",
    });

    expect(proposal.actions).toHaveLength(2);
    expect(proposal.actions[1]).toMatchObject({
      type: "addCard",
      card: { cardKey: "total-revenue" },
    });
  });

  it("rejects code-like and unknown action shapes", () => {
    expect(() =>
      DashboardProposalSchema.parse({
        version: 1,
        title: "Unsafe",
        intent: { objective: "Run arbitrary code" },
        actions: [{ type: "executeSql", sql: "select * from users" }],
        assumptions: [],
        missingInformation: [],
      }),
    ).toThrow();
  });

  it("allows an unbound global filter for the user to select later", () => {
    const proposal = DashboardProposalSchema.parse({
      version: 1,
      title: "Regional sales",
      intent: { objective: "Compare sales by region" },
      actions: [
        {
          type: "addGlobalFilter",
          filter: { field: "region", operator: "equals", label: "Region" },
        },
      ],
      assumptions: [],
      missingInformation: [],
    });

    expect(proposal.actions[0]).toMatchObject({
      type: "addGlobalFilter",
      filter: { field: "region" },
    });
  });
});

describe("ProposedCardSchema", () => {
  it("rejects invalid layout values", () => {
    expect(() =>
      ProposedCardSchema.parse({
        cardKey: "total-revenue",
        title: "Total revenue",
        data: {},
        layout: { x: 0, y: 0, width: 0, height: 2 },
      }),
    ).toThrow();
  });
});

describe("CreateDashboardProposalRequestSchema", () => {
  it("accepts the user request without provider secrets", () => {
    const request = CreateDashboardProposalRequestSchema.parse({
      prompt: "Create a sales dashboard",
      dashboardId: "dashboard-1",
      revision: "3",
      dataSourceId: "orders",
    });

    expect(request).toEqual({
      prompt: "Create a sales dashboard",
      dashboardId: "dashboard-1",
      revision: "3",
      dataSourceId: "orders",
    });
    expect(request).not.toHaveProperty("apiKey");
  });
});
