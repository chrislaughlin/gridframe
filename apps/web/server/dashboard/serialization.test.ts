import { afterEach, describe, expect, it } from "vitest";

import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";
import { serializeDashboardBootstrap } from "./serialization";

const databases: ReturnType<typeof openDashboardDatabase>[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
});

describe("serializeDashboardBootstrap", () => {
  it("replaces source Queries and Deeplinks with owner-scoped URLs", () => {
    const database = openDashboardDatabase(":memory:");
    databases.push(database);
    const result = new SqliteDashboardRepository(database).bootstrap("user/1");

    const response = serializeDashboardBootstrap(result);
    const firstCard = response.dashboard.config.cards[0];

    if (!firstCard) {
      throw new Error("Expected a seeded Card");
    }

    expect(response.dashboard.revision).toBe("1");
    expect(firstCard.query).toBe(
      `/api/gridframe/users/user%2F1/dashboards/${response.dashboard.id}/cards/${firstCard.id}/data`,
    );
    expect(firstCard.deeplink?.href).toBe(
      `/gridframe/users/user%2F1/dashboards/${response.dashboard.id}/cards/${firstCard.id}`,
    );
    expect(JSON.stringify(response)).not.toContain("/api/consumer/");
  });
});
