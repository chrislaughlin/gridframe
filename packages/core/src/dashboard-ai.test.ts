import { describe, expect, it } from "vitest";

import {
  CreateDashboardProposalRequestSchema,
  DashboardProposalSchema,
  ProposedCardSchema,
  dashboardProposalJsonSchema,
  normalizeDashboardProposalProviderOutput,
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

  it("bounds action count to prevent runaway structured output", () => {
    expect(() =>
      DashboardProposalSchema.parse({
        version: 1,
        title: "Runaway proposal",
        intent: { objective: "Repeat forever" },
        actions: Array.from({ length: 33 }, () => ({
          type: "moveCard",
          cardId: "card-1",
          x: 0,
          y: 0,
        })),
        assumptions: [],
        missingInformation: [],
      }),
    ).toThrow();
  });

  it("emits a self-contained provider schema", () => {
    const schema = dashboardProposalJsonSchema();
    const serialized = JSON.stringify(schema);

    expect(serialized).not.toContain('"$ref"');
    expect(serialized).not.toContain('"definitions"');
    expect(serialized).not.toContain('"oneOf"');
    expect(serialized).not.toContain('"allOf"');
    expect(
      (
        schema as {
          properties?: { actions?: { maxItems?: number } };
        }
      ).properties?.actions?.maxItems,
    ).toBe(32);
    expect(
      (
        schema as {
          properties?: {
            actions?: {
              items?: {
                properties?: { type?: { enum?: string[] } };
              };
            };
          };
        }
      ).properties?.actions?.items?.properties?.type?.enum,
    ).toContain("updateCard");
    expect(
      (
        schema as {
          properties?: {
            intent?: {
              required?: string[];
              properties?: { domain?: { anyOf?: unknown[] } };
            };
          };
        }
      ).properties?.intent?.required,
    ).toEqual(["domain", "objective", "audience"]);
    expect(
      (
        schema as {
          properties?: {
            intent?: {
              properties?: { domain?: { anyOf?: unknown[] } };
            };
          };
        }
      ).properties?.intent?.properties?.domain?.anyOf,
    ).toContainEqual({ type: "null" });
  });

  it("removes provider nulls only from optional fields", () => {
    const normalized = normalizeDashboardProposalProviderOutput({
      version: 1,
      title: "Sales",
      description: null,
      intent: { domain: null, objective: "Track sales", audience: null },
      actions: [
        {
          type: "addGlobalFilter",
          cardId: "not-valid-for-this-action",
          x: 4,
          filter: {
            id: null,
            label: null,
            field: "region",
            operator: "equals",
            value: null,
          },
        },
      ],
      assumptions: [],
      missingInformation: [],
      explanation: null,
    });

    expect(normalized).toEqual({
      version: 1,
      title: "Sales",
      intent: { objective: "Track sales" },
      actions: [
        {
          type: "addGlobalFilter",
          filter: {
            field: "region",
            operator: "equals",
          },
        },
      ],
      assumptions: [],
      missingInformation: [],
    });
  });

  it("restores required create metadata from the proposal", () => {
    const normalized = normalizeDashboardProposalProviderOutput({
      version: 1,
      title: "Monthly revenue",
      description: "Revenue and product performance.",
      intent: { domain: null, objective: "Track revenue", audience: null },
      actions: [
        {
          type: "createDashboard",
          title: null,
          description: null,
          card: null,
          cardId: null,
          x: null,
          y: null,
          width: null,
          height: null,
          filter: null,
          filterId: null,
        },
      ],
      assumptions: [],
      missingInformation: [],
      explanation: null,
    });

    expect(normalized).toMatchObject({
      actions: [
        {
          type: "createDashboard",
          title: "Monthly revenue",
          description: "Revenue and product performance.",
        },
      ],
    });
  });

  it("lets the server place generated cards and resolves metric aliases in sort fields", () => {
    const normalized = normalizeDashboardProposalProviderOutput({
      version: 1,
      title: "Monthly revenue",
      intent: { objective: "Track revenue" },
      actions: [
        {
          type: "addCard",
          card: {
            cardKey: "top-products",
            title: "Top products",
            data: {
              metrics: [
                {
                  field: "revenue",
                  aggregation: "sum",
                  alias: "Total Revenue",
                },
              ],
              dimensions: ["product"],
              sort: [{ field: "Total Revenue", direction: "desc" }],
            },
            layout: { x: 3, y: 0, width: 2, height: 4 },
          },
        },
      ],
      assumptions: [],
      missingInformation: [],
    });

    expect(normalized).toMatchObject({
      actions: [
        {
          type: "addCard",
          card: {
            data: { sort: [{ field: "revenue", direction: "desc" }] },
            layout: { width: 2, height: 4 },
          },
        },
      ],
    });
    expect(
      (
        normalized as {
          actions: Array<{ card: { layout: Record<string, unknown> } }>;
        }
      ).actions[0]?.card.layout,
    ).not.toHaveProperty("x");
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
