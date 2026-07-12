import { beforeEach, describe, expect, it } from "vitest";
import type {
  DashboardCardLayout,
  PanelCardDataResponse,
} from "@gridframe/core";

import {
  DashboardInvalidLibraryItemError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  createDashboardHandlers,
  type CardLibraryTemplate,
  type DashboardBootstrap,
  type DashboardRepository,
  type DashboardSeed,
  type PersistedDashboard,
  type PersistedDashboardCard,
} from ".";

const templates = [
  {
    key: "revenue",
    name: "Revenue",
    description: "Revenue metric",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    deeplinkLabel: "View revenue",
  },
  {
    key: "orders",
    name: "Orders",
    visualization: "bar",
    defaultLayout: { width: 3, height: 4 },
  },
] satisfies CardLibraryTemplate[];

const defaultDashboard = {
  title: "Operations overview",
  description: "Seeded dashboard",
  footer: { text: "Example footer" },
  cards: [
    { libraryItemKey: "revenue", layout: { x: 0, y: 0, width: 1, height: 2 } },
  ],
} satisfies DashboardSeed;

describe("createDashboardHandlers", () => {
  let repository: MemoryDashboardRepository;
  let resolverResult: PanelCardDataResponse;

  beforeEach(() => {
    repository = new MemoryDashboardRepository();
    resolverResult = {
      status: "success",
      data: {
        visualization: "metric",
        value: 42,
        label: "Revenue",
      },
    };
  });

  function handlers() {
    return createDashboardHandlers({
      repository,
      cardLibrary: templates,
      defaultDashboard: () => defaultDashboard,
      resolveCardData: () => Promise.resolve(resolverResult),
    });
  }

  it("bootstraps a default Dashboard when the user has none", async () => {
    const response = await handlers().bootstrap(
      jsonRequest({}),
      { userId: "user-1" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dashboards: [{ title: "Operations overview", isDefault: true }],
      dashboard: {
        revision: "1",
        config: {
          title: "Operations overview",
          cards: [
            {
              name: "Revenue",
              visualization: "metric",
              query:
                "/api/gridframe/users/user-1/dashboards/dashboard-1/cards/card-1/data",
              deeplink: {
                href:
                  "/gridframe/users/user-1/dashboards/dashboard-1/cards/card-1",
                label: "View revenue",
              },
            },
          ],
        },
      },
    });
  });

  it("returns not found when an explicit Dashboard is missing", async () => {
    await handlers().bootstrap(jsonRequest({}), { userId: "user-1" });

    const response = await handlers().bootstrap(
      jsonRequest({ dashboardId: "missing" }),
      { userId: "user-1" },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: "DASHBOARD_NOT_FOUND", message: "Dashboard not found" },
    });
  });

  it("persists a complete valid layout", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().updateLayout(
      jsonRequest({
        revision: String(dashboard.revision),
        cards: [{ id: "card-1", x: 1, y: 0, width: 1, height: 2 }],
      }),
      { userId: "user-1", dashboardId: dashboard.id },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      revision: "2",
      config: { cards: [{ id: "card-1", layout: { x: 1 } }] },
    });
  });

  it("rejects layouts that do not contain exactly the Dashboard Cards", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().updateLayout(
      jsonRequest({ revision: String(dashboard.revision), cards: [] }),
      { userId: "user-1", dashboardId: dashboard.id },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Invalid Dashboard layout",
      },
    });
  });

  it("returns a revision conflict when a mutation uses a stale revision", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().updateCard(
      jsonRequest({ revision: "99", name: "Updated" }),
      { userId: "user-1", dashboardId: dashboard.id, cardId: "card-1" },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "REVISION_CONFLICT",
        message: "Dashboard was changed by another request",
      },
    });
  });

  it("lists Card library templates with installed state", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().listCardLibrary(new Request("http://x"), {
      userId: "user-1",
      dashboardId: dashboard.id,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          key: "revenue",
          name: "Revenue",
          description: "Revenue metric",
          visualization: "metric",
          defaultLayout: { width: 1, height: 2 },
          addedCardId: "card-1",
        },
        {
          key: "orders",
          name: "Orders",
          visualization: "bar",
          defaultLayout: { width: 3, height: 4 },
        },
      ],
    });
  });

  it("adds a Card library item at the first available layout", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().addCard(
      jsonRequest({
        revision: String(dashboard.revision),
        libraryItemKey: "orders",
      }),
      { userId: "user-1", dashboardId: dashboard.id },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dashboard: {
        revision: "2",
        config: {
          cards: [
            { id: "card-1" },
            { id: "card-2", layout: { x: 1, y: 0, width: 3, height: 4 } },
          ],
        },
      },
      cardLibrary: {
        items: [
          { key: "revenue", addedCardId: "card-1" },
          { key: "orders", addedCardId: "card-2" },
        ],
      },
    });
  });

  it("rejects duplicate Card library items", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().addCard(
      jsonRequest({
        revision: String(dashboard.revision),
        libraryItemKey: "revenue",
      }),
      { userId: "user-1", dashboardId: dashboard.id },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "CARD_ALREADY_ADDED",
        message: "Card is already on this Dashboard",
      },
    });
  });

  it("removes the final Card and returns an empty Dashboard", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().removeCard(
      jsonRequest({ revision: String(dashboard.revision) }),
      { userId: "user-1", dashboardId: dashboard.id, cardId: "card-1" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dashboard: { revision: "2", config: { cards: [] } },
      cardLibrary: {
        items: [{ key: "revenue" }, { key: "orders" }],
      },
    });
  });

  it("returns validated Card data from the consumer resolver", async () => {
    const dashboard = await seedDashboard();

    const response = await handlers().fetchCardData(
      new Request("http://example.test/data"),
      { userId: "user-1", dashboardId: dashboard.id, cardId: "card-1" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(resolverResult);
  });

  it("rejects invalid Card data resolver output", async () => {
    const dashboard = await seedDashboard();
    resolverResult = { status: "success", data: undefined } as never;

    const response = await handlers().fetchCardData(
      new Request("http://example.test/data"),
      { userId: "user-1", dashboardId: dashboard.id, cardId: "card-1" },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "CARD_QUERY_FAILED",
        message: "Card data could not be loaded",
      },
    });
  });

  async function seedDashboard() {
    const response = await handlers().bootstrap(
      jsonRequest({}),
      { userId: "user-1" },
    );
    expect(response.status).toBe(200);
    return repository.loadDashboard("user-1", "dashboard-1");
  }
});

function jsonRequest(body: unknown) {
  return new Request("http://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

class MemoryDashboardRepository implements DashboardRepository {
  private readonly dashboards = new Map<string, PersistedDashboard>();
  private cardSequence = 1;
  private dashboardSequence = 1;

  async bootstrap(
    ownerUserId: string,
    dashboardId: string | undefined,
    seed: DashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[],
  ): Promise<DashboardBootstrap> {
    const owned = this.listOwnedDashboards(ownerUserId);
    let dashboard = dashboardId
      ? this.dashboards.get(dashboardId)
      : owned.find((item) => item.isDefault);

    if (!dashboard && !dashboardId) {
      dashboard = this.createSeededDashboard(ownerUserId, seed, cardLibrary);
    }

    if (!dashboard || dashboard.ownerUserId !== ownerUserId) {
      throw new DashboardNotFoundError();
    }

    return {
      dashboards: this.listOwnedDashboards(ownerUserId).map((item) => ({
        id: item.id,
        title: item.title,
        isDefault: item.isDefault,
      })),
      dashboard,
    };
  }

  async loadDashboard(ownerUserId: string, dashboardId: string) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard || dashboard.ownerUserId !== ownerUserId) {
      throw new DashboardNotFoundError();
    }
    return dashboard;
  }

  async updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: Array<{ id: string } & DashboardCardLayout>,
  ) {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    this.assertRevision(dashboard, revision);
    dashboard.revision += 1;
    dashboard.cards = dashboard.cards.map((card) => ({
      ...card,
      layout: cards.find((item) => item.id === card.id) ?? card.layout,
    }));
    return dashboard;
  }

  async updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ) {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    this.assertRevision(dashboard, revision);
    const card = dashboard.cards.find((item) => item.id === cardId);
    if (!card) throw new DashboardNotFoundError();
    card.name = name;
    dashboard.revision += 1;
    return dashboard;
  }

  async addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: Omit<PersistedDashboardCard, "id" | "dashboardId" | "sortOrder">,
  ) {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    this.assertRevision(dashboard, revision);
    const created = {
      ...card,
      id: `card-${this.cardSequence++}`,
      dashboardId,
      sortOrder: dashboard.cards.length,
    };
    dashboard.cards.push(created);
    dashboard.revision += 1;
    return dashboard;
  }

  async removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ) {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    this.assertRevision(dashboard, revision);
    if (!dashboard.cards.some((card) => card.id === cardId)) {
      throw new DashboardNotFoundError();
    }
    dashboard.cards = dashboard.cards.filter((card) => card.id !== cardId);
    dashboard.revision += 1;
    return dashboard;
  }

  async findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ) {
    return (await this.loadDashboard(ownerUserId, dashboardId)).cards.find(
      (card) => card.id === cardId,
    );
  }

  private createSeededDashboard(
    ownerUserId: string,
    seed: DashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[],
  ) {
    const dashboardId = `dashboard-${this.dashboardSequence++}`;
    const dashboard: PersistedDashboard = {
      id: dashboardId,
      ownerUserId,
      title: seed.title,
      description: seed.description,
      footer: seed.footer,
      isDefault: true,
      revision: 1,
      cards: seed.cards.map((seedCard, index) => {
        const template = cardLibrary.find(
          (item) => item.key === seedCard.libraryItemKey,
        );
        if (!template) throw new DashboardInvalidLibraryItemError();
        return {
          id: `card-${this.cardSequence++}`,
          dashboardId,
          libraryItemKey: template.key,
          name: template.name,
          visualization: template.visualization,
          deeplink: template.deeplinkLabel
            ? { label: template.deeplinkLabel }
            : undefined,
          layout: seedCard.layout ?? { x: 0, y: index * 4, ...template.defaultLayout },
          sortOrder: index,
        };
      }),
    };
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  private listOwnedDashboards(ownerUserId: string) {
    return [...this.dashboards.values()].filter(
      (dashboard) => dashboard.ownerUserId === ownerUserId,
    );
  }

  private assertRevision(dashboard: PersistedDashboard, revision: number) {
    if (dashboard.revision !== revision) {
      throw new DashboardRevisionConflictError();
    }
  }
}
