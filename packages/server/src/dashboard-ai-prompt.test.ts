import { describe, expect, it } from "vitest";

import {
  DASHBOARD_AI_SYSTEM_PROMPT,
  buildDashboardProposalPrompt,
  buildDashboardProposalRepairPrompt,
} from "./dashboard-ai-prompt";

describe("buildDashboardProposalPrompt", () => {
  it("requires newly created Dashboards to contain a Card", () => {
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "include at least one addCard action",
    );
  });

  it("tells the model how to replace an existing Visualization", () => {
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "use updateCard on the existing cardId with a different authorized cardKey",
    );
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "Never include an id in addCard",
    );
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "Use updateDashboardMetadata only when",
    );
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "Do not emit actions for unchanged Cards",
    );
    expect(DASHBOARD_AI_SYSTEM_PROMPT).toContain(
      "cardId exactly as it appears in currentDashboard.cards",
    );
  });

  it("regenerates repairs from trusted context instead of echoing bad output", () => {
    const prompt = buildDashboardProposalRepairPrompt({
      originalPrompt: JSON.stringify({
        request: "Replace the pie chart",
        mode: "edit",
      }),
      errors: [
        {
          code: "DUPLICATE_CARD_KEY",
          message: "Duplicate Card",
          path: ["actions"],
        },
      ],
    });

    expect(prompt).toContain("Replace the pie chart");
    expect(prompt).toContain("DUPLICATE_CARD_KEY");
    expect(prompt).toContain("regenerate");
    expect(prompt).not.toContain("invalidResponse");
  });

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
