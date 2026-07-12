import { describe, expect, it, vi } from "vitest";

import {
  DashboardInvalidLayoutError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  type DashboardRepository,
} from "./repository";
import {
  createCardMutationHandler,
  createLayoutMutationHandler,
} from "./mutation-handler";

const dashboard = {
  id: "dashboard-1",
  ownerUserId: "user-1",
  title: "Operations",
  isDefault: true,
  revision: 2,
  cards: [
    {
      id: "card-1",
      dashboardId: "dashboard-1",
      name: "Revenue",
      visualization: "metric" as const,
      sourceQuery: "revenue",
      layout: { x: 0, y: 0, width: 1, height: 2 },
      sortOrder: 0,
    },
  ],
};

function repository(overrides: Partial<DashboardRepository> = {}) {
  return {
    bootstrap: vi.fn(),
    loadDashboard: vi.fn().mockReturnValue(dashboard),
    findOwnedCard: vi.fn(),
    updateLayout: vi.fn().mockReturnValue(dashboard),
    updateCardName: vi.fn().mockReturnValue(dashboard),
    listCardLibrary: vi.fn().mockReturnValue([]),
    addCard: vi.fn().mockReturnValue(dashboard),
    removeCard: vi.fn().mockReturnValue(dashboard),
    ...overrides,
  } satisfies DashboardRepository;
}

describe("Dashboard mutation handlers", () => {
  it("validates and applies a complete layout request", async () => {
    const repo = repository();
    const response = await createLayoutMutationHandler(repo)(
      request({
        revision: "1",
        cards: [{ id: "card-1", x: 0, y: 0, width: 1, height: 2 }],
      }),
      "user-1",
      "dashboard-1",
    );

    expect(response.status).toBe(200);
    expect(repo.updateLayout).toHaveBeenCalledWith("user-1", "dashboard-1", 1, [
      { id: "card-1", x: 0, y: 0, width: 1, height: 2 },
    ]);
    expect(await response.json()).toMatchObject({ revision: "2" });
  });

  it("maps invalid input and invalid layouts to INVALID_REQUEST", async () => {
    const invalidRequest = await createLayoutMutationHandler(repository())(
      request({ revision: "one", cards: [] }),
      "user-1",
      "dashboard-1",
    );
    const invalidLayout = await createLayoutMutationHandler(
      repository({
        updateLayout: vi.fn(() => {
          throw new DashboardInvalidLayoutError(["Cards overlap"]);
        }),
      }),
    )(request({ revision: "1", cards: [] }), "user-1", "dashboard-1");

    expect(invalidRequest.status).toBe(400);
    expect(invalidLayout.status).toBe(400);
    expect(await invalidLayout.json()).toEqual({
      error: { code: "INVALID_REQUEST", message: "Invalid Dashboard layout" },
    });
  });

  it("maps stale and non-owned mutations without leaking ownership", async () => {
    const conflict = await createCardMutationHandler(
      repository({
        updateCardName: vi.fn(() => {
          throw new DashboardRevisionConflictError();
        }),
      }),
    )(
      request({ revision: "1", name: "Revenue" }),
      "user-1",
      "dashboard-1",
      "card-1",
    );
    const missing = await createCardMutationHandler(
      repository({
        updateCardName: vi.fn(() => {
          throw new DashboardNotFoundError();
        }),
      }),
    )(
      request({ revision: "1", name: "Revenue" }),
      "user-2",
      "dashboard-1",
      "card-1",
    );

    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { code: "REVISION_CONFLICT" },
    });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { code: "DASHBOARD_NOT_FOUND" },
    });
  });
});

function request(body: unknown) {
  return new Request("http://localhost/api", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
