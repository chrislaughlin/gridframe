import { afterEach, describe, expect, it, vi } from "vitest";

import { createCardDataHandler } from "./card-data-handler";
import {
  type DashboardRepository,
  type PersistedDashboardCardWithQuery,
} from "./repository";
import {
  createTestRepository,
  deleteTestDashboards,
  hasTestDatabase,
} from "./test-database";

const owner = "card-data-handler-test-user-1";
const otherOwner = "card-data-handler-test-user-2";
const dbIt = hasTestDatabase ? it : it.skip;

afterEach(async () => {
  await deleteTestDashboards([owner, otherOwner]);
});

function createRepository() {
  return createTestRepository();
}

describe("Card data HTTP handler", () => {
  it("returns 400 for invalid route identity", async () => {
    const repository = {
      bootstrap: vi.fn(),
      findOwnedCard: vi.fn(),
    } satisfies Pick<DashboardRepository, "bootstrap" | "findOwnedCard">;

    const response = await createCardDataHandler(repository, vi.fn())(
      new Request("http://localhost/card-data"),
      { userId: "", dashboardId: "dashboard-1", cardId: "card-1" },
    );

    expect(response.status).toBe(400);
    expect(repository.findOwnedCard).not.toHaveBeenCalled();
  });

  dbIt(
    "forwards the persisted Query once and returns adapted Visualization data",
    async () => {
      const repository = createRepository();
      const dashboard = (await repository.bootstrap(owner)).dashboard;
      const card = dashboard.cards.find(
        (candidate) => candidate.libraryItemKey === "revenue-by-region",
      );
      if (!card) throw new Error("Expected seeded chart Card");
      const fetchSource = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            records: [
              { region: "North", revenue: 1200 },
              { region: "South", revenue: 900 },
            ],
          }),
          { status: 200 },
        ),
      );

      const response = await createCardDataHandler(repository, fetchSource)(
        new Request("http://localhost/api/gridframe/card-data"),
        { userId: owner, dashboardId: dashboard.id, cardId: card.id },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        status: "success",
        data: {
          visualization: "bar",
          indexKey: "region",
          data: [
            { region: "North", revenue: 1200 },
            { region: "South", revenue: 900 },
          ],
        },
      });
      expect(fetchSource).toHaveBeenCalledTimes(1);
      expect(fetchSource).toHaveBeenCalledWith(
        "http://localhost:3000/api/consumer/cards/revenue-by-region",
        expect.objectContaining({
          method: "GET",
          signal: expect.any(AbortSignal),
        }),
      );
    },
  );

  dbIt(
    "derives source data from the same forwarded result when requested",
    async () => {
      const repository = createRepository();
      const dashboard = (await repository.bootstrap(owner)).dashboard;
      const card = dashboard.cards[0]!;
      const fetchSource = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            records: [{ amount: 25 }, { amount: 75, region: "North" }],
          }),
          { status: 200 },
        ),
      );
      const response = await createCardDataHandler(repository, fetchSource)(
        new Request("http://localhost/card-data?includeSource=true"),
        { userId: owner, dashboardId: dashboard.id, cardId: card.id },
      );
      await expect(response.json()).resolves.toMatchObject({
        status: "success",
        data: { visualization: "metric", value: 100 },
        sourceData: {
          columns: [
            { key: "amount", label: "Amount", align: "right" },
            { key: "region", label: "Region", align: "left" },
          ],
          rows: [{ amount: 25 }, { amount: 75, region: "North" }],
        },
      });
      expect(fetchSource).toHaveBeenCalledTimes(1);
    },
  );

  dbIt("returns the same 404 for a missing or non-owned Card", async () => {
    const repository = createRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;
    const response = await createCardDataHandler(repository, vi.fn())(
      new Request("http://localhost/card-data"),
      {
        userId: otherOwner,
        dashboardId: dashboard.id,
        cardId: dashboard.cards[0]?.id ?? "missing",
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "DASHBOARD_CARD_NOT_FOUND" },
    });
  });

  it("rejects an unsafe persisted source Query without forwarding it", async () => {
    const card = {
      id: "card-1",
      dashboardId: "dashboard-1",
      name: "Unsafe",
      visualization: "metric",
      sourceQuery: "https://attacker.example/data",
      layout: { x: 0, y: 0, width: 1, height: 2 },
      sortOrder: 0,
    } satisfies PersistedDashboardCardWithQuery;
    const repository = {
      bootstrap: vi.fn(),
      findOwnedCard: vi.fn(async () => card),
    } satisfies Pick<DashboardRepository, "bootstrap" | "findOwnedCard">;
    const fetchSource = vi.fn();

    const response = await createCardDataHandler(repository, fetchSource)(
      new Request("http://localhost/card-data"),
      { userId: owner, dashboardId: "dashboard-1", cardId: "card-1" },
    );

    expect(response.status).toBe(502);
    expect(fetchSource).not.toHaveBeenCalled();
  });

  dbIt("maps upstream failures to a safe Card Query error", async () => {
    const repository = createRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;
    const card = dashboard.cards[0];
    if (!card) throw new Error("Expected seeded Card");

    const response = await createCardDataHandler(
      repository,
      vi.fn().mockResolvedValue(new Response("sensitive", { status: 500 })),
    )(new Request("http://localhost/card-data"), {
      userId: owner,
      dashboardId: dashboard.id,
      cardId: card.id,
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "CARD_QUERY_FAILED",
        message: "Card data could not be loaded",
      },
    });
  });
});
