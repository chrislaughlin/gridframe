import { describe, expect, it } from "vitest";

import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";
import {
  createAddCardHandler,
  createCardLibraryHandler,
  createRemoveCardHandler,
} from "./card-library-handler";

function setup() {
  const database = openDashboardDatabase(":memory:");
  const repository = new SqliteDashboardRepository(database);
  const dashboard = repository.bootstrap("user-1").dashboard;
  return { database, repository, dashboard };
}

describe("Card library HTTP handlers", () => {
  it("lists public installed state without source Queries", async () => {
    const { database, repository, dashboard } = setup();
    const response = createCardLibraryHandler(repository)(
      new Request("http://localhost"),
      "user-1",
      dashboard.id,
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(
      body.items.find((item: { key: string }) => item.key === "total-revenue")
        .addedCardId,
    ).toBe(dashboard.cards[0]?.id);
    expect(JSON.stringify(body)).not.toContain("/api/consumer/");
    database.close();
  });

  it("removes and adds with revision-checked response contracts", async () => {
    const { database, repository, dashboard } = setup();
    const removedResponse = await createRemoveCardHandler(repository)(
      request({ revision: "1" }, "DELETE"),
      "user-1",
      dashboard.id,
      dashboard.cards[0]!.id,
    );
    const removed = await removedResponse.json();
    expect(removed.dashboard.revision).toBe("2");
    expect(
      removed.cardLibrary.items.find(
        (item: { key: string }) => item.key === "total-revenue",
      ).addedCardId,
    ).toBeUndefined();

    const addedResponse = await createAddCardHandler(repository)(
      request({ revision: "2", libraryItemKey: "total-revenue" }, "POST"),
      "user-1",
      dashboard.id,
    );
    const added = await addedResponse.json();
    expect(added.dashboard.revision).toBe("3");
    expect(
      added.cardLibrary.items.find(
        (item: { key: string }) => item.key === "total-revenue",
      ).addedCardId,
    ).not.toBe(dashboard.cards[0]!.id);
    database.close();
  });

  it("maps duplicate, stale, invalid, and non-owned requests safely", async () => {
    const { database, repository, dashboard } = setup();
    const duplicate = await createAddCardHandler(repository)(
      request({ revision: "1", libraryItemKey: "total-revenue" }, "POST"),
      "user-1",
      dashboard.id,
    );
    const invalid = await createAddCardHandler(repository)(
      request({ revision: "1", libraryItemKey: "unknown" }, "POST"),
      "user-1",
      dashboard.id,
    );
    const missing = createCardLibraryHandler(repository)(
      new Request("http://localhost"),
      "user-2",
      dashboard.id,
    );
    const removed = await createRemoveCardHandler(repository)(
      request({ revision: "1" }, "DELETE"),
      "user-1",
      dashboard.id,
      dashboard.cards[0]!.id,
    );
    const stale = await createAddCardHandler(repository)(
      request({ revision: "1", libraryItemKey: "total-revenue" }, "POST"),
      "user-1",
      dashboard.id,
    );
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({
      error: { code: "CARD_ALREADY_ADDED" },
    });
    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
    expect(removed.status).toBe(200);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: { code: "REVISION_CONFLICT" },
    });
    database.close();
  });

  it("keeps an empty Dashboard addable and uses first-fit placement", async () => {
    const { database, repository, dashboard: initial } = setup();
    let dashboard = initial;
    for (const card of initial.cards) {
      const response = await createRemoveCardHandler(repository)(
        request({ revision: String(dashboard.revision) }, "DELETE"),
        "user-1",
        dashboard.id,
        card.id,
      );
      dashboard = repository.bootstrap("user-1", dashboard.id).dashboard;
      expect(response.status).toBe(200);
    }
    expect(dashboard.cards).toEqual([]);
    const response = await createAddCardHandler(repository)(
      request(
        {
          revision: String(dashboard.revision),
          libraryItemKey: "recent-orders",
        },
        "POST",
      ),
      "user-1",
      dashboard.id,
    );
    const body = await response.json();
    expect(body.dashboard.config.cards[0].layout).toEqual({
      x: 0,
      y: 0,
      width: 4,
      height: 4,
    });
    database.close();
  });
});

function request(body: unknown, method: "POST" | "DELETE") {
  return new Request("http://localhost", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
