import { afterEach, describe, expect, it } from "vitest";

import { createBootstrapHandler } from "./bootstrap-handler";
import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";

const databases: ReturnType<typeof openDashboardDatabase>[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
});

function createHandler() {
  const database = openDashboardDatabase(":memory:");
  databases.push(database);
  return createBootstrapHandler(new SqliteDashboardRepository(database));
}

describe("Dashboard bootstrap HTTP handler", () => {
  it("returns a validated owner-scoped default Dashboard", async () => {
    const response = await createHandler()(
      new Request(
        "http://localhost/api/gridframe/users/user-1/dashboards/bootstrap",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      ),
      "user-1",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dashboards: [{ title: "Operations overview", isDefault: true }],
      dashboard: {
        revision: "1",
        config: { cards: expect.any(Array) },
      },
    });
  });

  it("returns 400 for invalid JSON input", async () => {
    const response = await createHandler()(
      new Request("http://localhost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
      "user-1",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("returns the same 404 for a missing or non-owned Dashboard", async () => {
    const handler = createHandler();
    const first = await handler(
      new Request("http://localhost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
      "user-1",
    );
    const owned = (await first.json()) as { dashboard: { id: string } };
    const response = await handler(
      new Request("http://localhost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId: owned.dashboard.id }),
      }),
      "user-2",
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "DASHBOARD_NOT_FOUND" },
    });
  });
});
