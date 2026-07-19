import { describe, expect, it } from "vitest";
import type { AICardDefinition, AIDataField } from "@gridframe/core";

import { validateDashboardProposal } from "./dashboard-proposal-validation";
import type { DashboardAIContext } from "./dashboard-ai-types";

const aiCardLibrary = [
  {
    key: "total-revenue",
    name: "Total revenue",
    description: "A revenue KPI.",
    visualization: "metric",
    tags: ["sales"],
    questionsAnswered: ["What is revenue?"],
    requiredDataShape: { minMetrics: 1, maxMetrics: 1 },
    supportedFilters: ["equals", "between"],
    defaultLayout: { width: 1, height: 2 },
  },
] satisfies AICardDefinition[];

const dataCatalogue = [
  {
    key: "revenue",
    label: "Revenue",
    type: "number",
    role: "metric",
    allowedAggregations: ["sum", "average"],
    filterable: true,
    sortable: true,
  },
  {
    key: "region",
    label: "Region",
    type: "category",
    role: "dimension",
    filterable: true,
    sortable: true,
  },
] satisfies AIDataField[];

function context(
  overrides: Partial<DashboardAIContext> = {},
): DashboardAIContext {
  return {
    userId: "user-1",
    dashboard: {
      id: "dashboard-1",
      ownerUserId: "user-1",
      title: "Existing dashboard",
      isDefault: true,
      revision: 4,
      cards: [
        {
          id: "existing-card",
          dashboardId: "dashboard-1",
          libraryItemKey: "existing-card",
          name: "Existing Card",
          visualization: "table",
          layout: { x: 0, y: 4, width: 4, height: 4 },
          sortOrder: 0,
        },
      ],
    },
    aiCardLibrary,
    cardLibrary: [
      {
        key: "total-revenue",
        name: "Total revenue",
        description: "A revenue KPI.",
        visualization: "metric",
        defaultLayout: { width: 1, height: 2 },
      },
    ],
    dataCatalogue,
    permissions: [],
    ...overrides,
  };
}

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    title: "Sales overview",
    intent: { objective: "Track revenue" },
    actions: [
      {
        type: "addCard",
        card: {
          cardKey: "total-revenue",
          title: "Total revenue",
          data: {
            metrics: [{ field: "revenue", aggregation: "sum" }],
          },
          layout: { x: 0, y: 0, width: 1, height: 2 },
        },
      },
    ],
    assumptions: [],
    missingInformation: [],
    ...overrides,
  };
}

describe("validateDashboardProposal", () => {
  it("accepts a valid proposal and preserves an existing Card", () => {
    const result = validateDashboardProposal(proposal(), context());

    expect(result.validation).toEqual({
      valid: true,
      canApply: true,
      errors: [],
      warnings: [],
    });
    expect(result.update?.cards.map((card) => card.id)).toEqual([
      "existing-card",
      undefined,
    ]);
    expect(result.preview.cards).toEqual([
      expect.objectContaining({
        id: "existing-card",
        changes: ["unchanged"],
        layout: { x: 0, y: 4, width: 4, height: 4 },
      }),
      expect.objectContaining({
        changes: ["added"],
        layout: { x: 0, y: 0, width: 1, height: 2 },
      }),
    ]);
  });

  it("keeps a custom existing Card that has no Card-library key", () => {
    const current = context();
    current.dashboard!.cards[0]!.libraryItemKey = undefined;
    current.dashboard!.cards[0]!.sourceQuery = "/consumer/custom-card";

    const result = validateDashboardProposal(proposal(), current);

    expect(result.validation.valid).toBe(true);
    expect(result.update?.cards[0]).toMatchObject({
      id: "existing-card",
      libraryItemKey: undefined,
      sourceQuery: "/consumer/custom-card",
    });
  });

  it("requires explicit creation for a new Dashboard", () => {
    const creating = context({ dashboard: undefined });
    const invalid = validateDashboardProposal(proposal(), creating);
    const valid = validateDashboardProposal(
      proposal({
        actions: [
          {
            type: "createDashboard",
            title: "New sales dashboard",
          },
          ...proposal().actions,
        ],
      }),
      creating,
    );

    expect(invalid.validation.errors).toContainEqual(
      expect.objectContaining({ code: "CREATE_DASHBOARD_REQUIRED" }),
    );
    expect(valid.validation.valid).toBe(true);
    expect(valid.update?.title).toBe("New sales dashboard");
  });

  it("rejects an unknown cardKey", () => {
    const result = validateDashboardProposal(
      proposal({
        actions: [
          {
            type: "addCard",
            card: {
              cardKey: "invented-card",
              title: "Invented",
              data: {},
              layout: { width: 1, height: 2 },
            },
          },
        ],
      }),
      context(),
    );

    expect(result.validation.errors).toContainEqual(
      expect.objectContaining({ code: "UNKNOWN_CARD_KEY" }),
    );
  });

  it("rejects an unknown field and unsupported aggregation", () => {
    const result = validateDashboardProposal(
      proposal({
        actions: [
          {
            type: "addCard",
            card: {
              cardKey: "total-revenue",
              title: "Revenue",
              data: {
                metrics: [
                  { field: "invented", aggregation: "sum" },
                  { field: "revenue", aggregation: "max" },
                ],
              },
              layout: { x: 0, y: 0, width: 1, height: 2 },
            },
          },
        ],
      }),
      context(),
    );

    expect(result.validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "UNKNOWN_FIELD",
        "UNSUPPORTED_AGGREGATION",
        "INVALID_DATA_SHAPE",
      ]),
    );
  });

  it("rejects fields used in unsupported metric and dimension roles", () => {
    const result = validateDashboardProposal(
      proposal({
        actions: [
          {
            type: "addCard",
            card: {
              cardKey: "total-revenue",
              title: "Invalid roles",
              data: {
                metrics: [{ field: "region", aggregation: "sum" }],
                dimensions: ["revenue"],
              },
              layout: { x: 0, y: 0, width: 1, height: 2 },
            },
          },
        ],
      }),
      context(),
    );

    expect(result.validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "UNSUPPORTED_METRIC_FIELD",
        "UNSUPPORTED_DIMENSION_FIELD",
      ]),
    );
  });

  it("rejects layout values that exceed or overlap the Dashboard grid", () => {
    const result = validateDashboardProposal(
      proposal({
        actions: [
          {
            type: "addCard",
            card: {
              cardKey: "total-revenue",
              title: "Revenue",
              data: { metrics: [{ field: "revenue", aggregation: "sum" }] },
              layout: { x: 3, y: 4, width: 2, height: 4 },
            },
          },
        ],
      }),
      context(),
    );

    expect(result.validation.errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_LAYOUT" }),
    );
  });

  it("allows preview but prevents apply when information is missing", () => {
    const result = validateDashboardProposal(
      proposal({ missingInformation: ["Choose a reporting currency."] }),
      context(),
    );

    expect(result.validation).toMatchObject({ valid: true, canApply: false });
    expect(result.validation.warnings).toContainEqual(
      expect.objectContaining({
        code: "MISSING_INFORMATION",
        message: "Choose a reporting currency.",
      }),
    );
  });

  it("rejects malformed proposal data through the same public seam", () => {
    const result = validateDashboardProposal(
      { title: "No version" },
      context(),
    );

    expect(result.validation.valid).toBe(false);
    expect(result.validation.errors[0]?.code).toBe("INVALID_PROPOSAL");
  });
});
