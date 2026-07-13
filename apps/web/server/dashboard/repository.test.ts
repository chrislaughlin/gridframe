import { afterEach, describe, expect, it } from "vitest";

import {
  DashboardInvalidLayoutError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
} from "./repository";
import {
  createTestRepository,
  deleteTestDashboards,
  hasTestDatabase,
} from "./test-database";

const owner = "repository-test-user-1";
const otherOwner = "repository-test-user-2";

afterEach(async () => {
  await deleteTestDashboards([owner, otherOwner]);
});

describe.skipIf(!hasTestDatabase)("NeonDashboardRepository.bootstrap", () => {
  it("seeds one default Dashboard with metric, chart, and table Cards", async () => {
    const repository = createTestRepository();
    const result = await repository.bootstrap(owner);

    expect(result.dashboard.ownerUserId).toBe(owner);
    expect(result.dashboard.isDefault).toBe(true);
    expect(result.dashboard.revision).toBe(1);
    expect(result.dashboard.cards.map((card) => card.visualization)).toEqual([
      "metric",
      "bar",
      "table",
    ]);
    expect(result.dashboards).toEqual([
      {
        id: result.dashboard.id,
        title: result.dashboard.title,
        isDefault: true,
      },
    ]);
  });

  it("returns the same default Dashboard for repeated and concurrent bootstrap", async () => {
    const repository = createTestRepository();
    const [first, second] = await Promise.all([
      repository.bootstrap(owner),
      repository.bootstrap(owner),
    ]);

    expect(second.dashboard.id).toBe(first.dashboard.id);
    expect((await repository.bootstrap(owner)).dashboard.id).toBe(
      first.dashboard.id,
    );
  });

  it("does not reveal another user's Dashboard", async () => {
    const repository = createTestRepository();
    const owned = (await repository.bootstrap(owner)).dashboard;

    await expect(repository.bootstrap(otherOwner, owned.id)).rejects.toThrow(
      DashboardNotFoundError,
    );
  });
});

describe.skipIf(!hasTestDatabase)("NeonDashboardRepository mutations", () => {
  it("lists, removes, and re-adds Card library items", async () => {
    const repository = createTestRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;
    const before = await repository.listCardLibrary(owner, dashboard.id);
    expect(
      before.find((item) => item.key === "total-revenue")?.addedCardId,
    ).toBe(
      dashboard.cards.find((card) => card.libraryItemKey === "total-revenue")
        ?.id,
    );

    const removed = await repository.removeCard(
      owner,
      dashboard.id,
      dashboard.cards[0]!.id,
      dashboard.revision,
    );
    const added = await repository.addCard(
      owner,
      dashboard.id,
      removed.revision,
      "total-revenue",
    );

    expect(added.revision).toBe(3);
    expect(
      added.cards.filter((card) => card.libraryItemKey === "total-revenue"),
    ).toHaveLength(1);
  });

  it("enforces ownership, uniqueness, and optimistic revisions", async () => {
    const repository = createTestRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;

    await expect(
      repository.addCard(
        owner,
        dashboard.id,
        dashboard.revision,
        "total-revenue",
      ),
    ).rejects.toThrow();
    await expect(
      repository.removeCard(
        otherOwner,
        dashboard.id,
        dashboard.cards[0]!.id,
        dashboard.revision,
      ),
    ).rejects.toThrow(DashboardNotFoundError);

    const removed = await repository.removeCard(
      owner,
      dashboard.id,
      dashboard.cards[0]!.id,
      dashboard.revision,
    );
    await expect(
      repository.addCard(
        owner,
        dashboard.id,
        dashboard.revision,
        "total-revenue",
      ),
    ).rejects.toThrow(DashboardRevisionConflictError);
    expect(removed.revision).toBe(2);
  });

  it("keeps an empty Dashboard valid and places a new Card without overlap", async () => {
    const repository = createTestRepository();
    let dashboard = (await repository.bootstrap(owner)).dashboard;
    for (const card of [...dashboard.cards]) {
      dashboard = await repository.removeCard(
        owner,
        dashboard.id,
        card.id,
        dashboard.revision,
      );
    }
    expect(dashboard.cards).toEqual([]);

    dashboard = await repository.addCard(
      owner,
      dashboard.id,
      dashboard.revision,
      "recent-orders",
    );
    expect(dashboard.cards[0]?.layout).toEqual({
      x: 0,
      y: 0,
      width: 4,
      height: 4,
    });
  });

  it("persists a complete valid layout and increments the revision once", async () => {
    const repository = createTestRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;
    const [metric, chart, table] = dashboard.cards;

    const updated = await repository.updateLayout(
      owner,
      dashboard.id,
      dashboard.revision,
      [
        { id: metric!.id, x: 0, y: 0, width: 1, height: 2 },
        { id: chart!.id, x: 1, y: 0, width: 3, height: 4 },
        { id: table!.id, x: 0, y: 4, width: 4, height: 4 },
      ],
    );

    expect(updated.revision).toBe(2);
    expect(updated.cards[1]?.layout).toEqual({
      x: 1,
      y: 0,
      width: 3,
      height: 4,
    });
    expect((await repository.bootstrap(owner, dashboard.id)).dashboard).toEqual(
      updated,
    );
  });

  it("rejects invalid layouts without changing the Dashboard", async () => {
    const repository = createTestRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;

    await expect(
      repository.updateLayout(
        owner,
        dashboard.id,
        dashboard.revision,
        dashboard.cards.map((card) => ({
          id: card.id,
          x: 0,
          y: 0,
          width: 4,
          height: 4,
        })),
      ),
    ).rejects.toThrow(DashboardInvalidLayoutError);
    expect((await repository.bootstrap(owner)).dashboard).toEqual(dashboard);
  });

  it("renames an owned Card and rejects stale revisions atomically", async () => {
    const repository = createTestRepository();
    const dashboard = (await repository.bootstrap(owner)).dashboard;
    const card = dashboard.cards[0]!;

    const updated = await repository.updateCardName(
      owner,
      dashboard.id,
      card.id,
      dashboard.revision,
      "Net revenue",
    );
    expect(updated.revision).toBe(2);
    expect(updated.cards[0]?.name).toBe("Net revenue");

    await expect(
      repository.updateCardName(
        owner,
        dashboard.id,
        card.id,
        dashboard.revision,
        "Stale name",
      ),
    ).rejects.toThrow(DashboardRevisionConflictError);
    expect((await repository.bootstrap(owner)).dashboard).toEqual(updated);
  });
});
