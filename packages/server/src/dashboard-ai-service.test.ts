import { describe, expect, it, vi } from "vitest";
import type {
  DashboardProposal,
  DashboardProposalValidationIssueCode,
} from "@gridframe/core";

import type { DashboardAIProvider } from "./ai-provider";
import {
  DashboardAIError,
  createDashboardAIService,
  type DashboardAIServiceOptions,
} from "./dashboard-ai-service";
import type {
  DashboardAIRepository,
  DashboardProposalApplyUpdate,
} from "./dashboard-ai-types";
import type { PersistedDashboard } from "./index";

const dashboard: PersistedDashboard = {
  id: "dashboard-1",
  ownerUserId: "user-1",
  title: "Existing dashboard",
  isDefault: true,
  revision: 4,
  cards: [
    {
      id: "existing-card",
      dashboardId: "dashboard-1",
      libraryItemKey: "recent-orders",
      name: "Recent orders",
      visualization: "table",
      layout: { x: 0, y: 4, width: 4, height: 4 },
      sortOrder: 0,
    },
  ],
};

const cardLibrary = [
  {
    key: "total-revenue",
    name: "Total revenue",
    description: "A revenue KPI.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
  },
];

const aiCardLibrary = [
  {
    key: "total-revenue",
    name: "Total revenue",
    description: "A revenue KPI.",
    visualization: "metric",
    tags: ["sales"],
    questionsAnswered: ["What is total revenue?"],
    requiredDataShape: { minMetrics: 1, maxMetrics: 1 },
    defaultLayout: { width: 1, height: 2 },
  },
] as const;

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
] as const;

function validProposal(): DashboardProposal {
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
  };
}

function repository() {
  const applyDashboardProposal = vi.fn(
    async (
      _ownerUserId: string,
      _dashboardId: string,
      revision: number,
      update: DashboardProposalApplyUpdate,
    ) => ({
      ...dashboard,
      ...update,
      revision: revision + 1,
      cards: update.cards.map((card, index) => ({
        ...card,
        id: card.id ?? `created-${index}`,
        dashboardId: dashboard.id,
        sortOrder: index,
      })),
    }),
  );
  const createDashboardFromProposal = vi.fn(
    async (_ownerUserId: string, update: DashboardProposalApplyUpdate) => ({
      ...dashboard,
      id: "created-dashboard",
      ...update,
      revision: 1,
      cards: update.cards.map((card, index) => ({
        ...card,
        id: card.id ?? `created-${index}`,
        dashboardId: "created-dashboard",
        sortOrder: index,
      })),
    }),
  );
  return {
    bootstrap: vi.fn(),
    loadDashboard: vi.fn(async () => structuredClone(dashboard)),
    updateLayout: vi.fn(),
    updateCardName: vi.fn(),
    updateGlobalFilterValue: vi.fn(),
    addCard: vi.fn(),
    removeCard: vi.fn(),
    findOwnedCard: vi.fn(),
    createDashboardFromProposal,
    applyDashboardProposal,
  } satisfies DashboardAIRepository;
}

function provider(responses: string[]): DashboardAIProvider & {
  generate: ReturnType<typeof vi.fn>;
} {
  return {
    model: "test/model",
    generate: vi.fn(async () => ({
      content: responses.shift() ?? "not-json",
      model: "test/model",
    })),
  };
}

function service(
  model: DashboardAIProvider,
  repo: DashboardAIRepository = repository(),
  authorize = vi.fn(async () => true),
  overrides: Partial<DashboardAIServiceOptions> = {},
) {
  return createDashboardAIService({
    repository: repo,
    provider: model,
    aiCardLibrary,
    cardLibrary,
    dataCatalogue,
    permissions: ["dashboard:read", "dashboard:write"],
    authorize,
    ...overrides,
  });
}

async function expectProposalRepair(
  invalid: DashboardProposal,
  validationCode: DashboardProposalValidationIssueCode,
) {
  const model = provider([
    JSON.stringify(invalid),
    JSON.stringify(validProposal()),
  ]);

  await expect(
    service(model).proposeDashboard({
      userId: "user-1",
      principalId: "user-1",
      dashboardId: "dashboard-1",
      prompt: "Add revenue",
    }),
  ).resolves.toMatchObject({ validation: { valid: true } });
  expect(model.generate).toHaveBeenCalledTimes(2);
  expect(model.generate.mock.calls[1]?.[0].userPrompt).toContain(
    validationCode,
  );
}

describe("DashboardAIService proposal generation", () => {
  it("accepts a valid structured proposal", async () => {
    const model = provider([JSON.stringify(validProposal())]);

    await expect(
      service(model).proposeDashboard({
        userId: "user-1",
        principalId: "user-1",
        dashboardId: "dashboard-1",
        revision: "4",
        prompt: "Add revenue",
      }),
    ).resolves.toMatchObject({
      proposal: { title: "Sales overview" },
      validation: { valid: true, canApply: true },
      dashboardId: "dashboard-1",
      revision: "4",
    });
    expect(model.generate).toHaveBeenCalledTimes(1);
  });

  it("repairs an unknown Card once", async () => {
    const invalid = validProposal();
    const action = invalid.actions[0];
    if (action?.type === "addCard") action.card.cardKey = "invented";

    await expectProposalRepair(invalid, "UNKNOWN_CARD_KEY");
  });

  it("repairs a proposal that fails capability validation once", async () => {
    const invalid = validProposal();
    const action = invalid.actions[0];
    if (action?.type === "addCard") {
      const metric = action.card.data.metrics?.[0];
      if (metric) metric.aggregation = "count";
    }

    await expectProposalRepair(invalid, "UNSUPPORTED_AGGREGATION");
  });

  it("rejects malformed JSON after at most one repair attempt", async () => {
    const model = provider(["not-json", "still-not-json"]);

    await expect(
      service(model).proposeDashboard({
        userId: "user-1",
        principalId: "user-1",
        dashboardId: "dashboard-1",
        prompt: "Add revenue",
      }),
    ).rejects.toMatchObject({ code: "AI_PROPOSAL_INVALID" });
    expect(model.generate).toHaveBeenCalledTimes(2);
  });

  it("checks authorization before loading data or calling the model", async () => {
    const model = provider([JSON.stringify(validProposal())]);
    const repo = repository();
    const ai = service(
      model,
      repo,
      vi.fn(async () => false),
    );

    await expect(
      ai.proposeDashboard({
        userId: "user-1",
        principalId: "user-1",
        dashboardId: "dashboard-1",
        prompt: "Add revenue",
      }),
    ).rejects.toBeInstanceOf(DashboardAIError);
    expect(repo.loadDashboard).not.toHaveBeenCalled();
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("filters Cards whose required permissions are not granted", async () => {
    const ai = service(provider([]), repository(), undefined, {
      aiCardLibrary: aiCardLibrary.map((card) => ({
        ...card,
        requiredPermissions: ["sales:read"],
      })),
      permissions: [],
    });

    const result = await ai.validateProposal({
      userId: "user-1",
      principalId: "user-1",
      dashboardId: "dashboard-1",
      revision: "4",
      proposal: validProposal(),
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "UNKNOWN_CARD_KEY" }),
    );
  });

  it("defensively removes sensitive fields before prompt construction", async () => {
    const model = provider([JSON.stringify(validProposal())]);
    const ai = service(model, repository(), undefined, {
      dataCatalogue: [
        ...dataCatalogue,
        {
          key: "customer_email",
          label: "Customer email",
          type: "string",
          role: "dimension",
          sensitive: true,
        },
      ],
    });

    await ai.proposeDashboard({
      userId: "user-1",
      principalId: "user-1",
      dashboardId: "dashboard-1",
      revision: "4",
      prompt: "Add revenue",
    });

    expect(model.generate.mock.calls[0]?.[0].userPrompt).not.toContain(
      "customer_email",
    );
  });
});

describe("DashboardAIService proposal application", () => {
  it("keeps creation virtual until explicit apply", async () => {
    const repo = repository();
    const creation = validProposal();
    creation.actions.unshift({
      type: "createDashboard",
      title: "New sales dashboard",
    });
    const model = provider([JSON.stringify(creation)]);
    const ai = service(model, repo);

    const preview = await ai.proposeDashboard({
      userId: "user-1",
      principalId: "user-1",
      prompt: "Create a sales dashboard",
    });

    expect(preview.dashboardId).toBeUndefined();
    expect(repo.bootstrap).not.toHaveBeenCalled();
    expect(repo.loadDashboard).not.toHaveBeenCalled();
    expect(repo.createDashboardFromProposal).not.toHaveBeenCalled();

    const created = await ai.applyProposal({
      userId: "user-1",
      principalId: "user-1",
      proposal: creation,
    });
    expect(repo.createDashboardFromProposal).toHaveBeenCalledTimes(1);
    expect(created.id).toBe("created-dashboard");
  });

  it("applies all actions through one transactional repository call", async () => {
    const repo = repository();
    const result = await service(provider([]), repo).applyProposal({
      userId: "user-1",
      principalId: "user-1",
      dashboardId: "dashboard-1",
      revision: "4",
      proposal: validProposal(),
    });

    expect(repo.applyDashboardProposal).toHaveBeenCalledTimes(1);
    expect(repo.applyDashboardProposal).toHaveBeenCalledWith(
      "user-1",
      "dashboard-1",
      4,
      expect.objectContaining({
        cards: [
          expect.objectContaining({ id: "existing-card" }),
          expect.objectContaining({
            id: undefined,
            libraryItemKey: "total-revenue",
          }),
        ],
      }),
    );
    expect(result.revision).toBe(5);
  });

  it("prevents application on a stale revision", async () => {
    const repo = repository();

    await expect(
      service(provider([]), repo).applyProposal({
        userId: "user-1",
        principalId: "user-1",
        dashboardId: "dashboard-1",
        revision: "3",
        proposal: validProposal(),
      }),
    ).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect(repo.applyDashboardProposal).not.toHaveBeenCalled();
  });

  it("does not apply a preview with missing information", async () => {
    const repo = repository();
    const proposal = validProposal();
    proposal.missingInformation = ["Choose a reporting currency."];

    await expect(
      service(provider([]), repo).applyProposal({
        userId: "user-1",
        principalId: "user-1",
        dashboardId: "dashboard-1",
        revision: "4",
        proposal,
      }),
    ).rejects.toMatchObject({ code: "AI_PROPOSAL_NOT_APPLICABLE" });
    expect(repo.applyDashboardProposal).not.toHaveBeenCalled();
  });
});
