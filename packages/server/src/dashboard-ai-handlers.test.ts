import { describe, expect, it, vi } from "vitest";

import { DashboardAIError } from "./dashboard-ai-service";
import { createDashboardAIHandlers } from "./dashboard-ai-handlers";
import type { DashboardAIService } from "./dashboard-ai-service";

const proposal = {
  version: 1 as const,
  title: "Sales",
  intent: { objective: "Track sales" },
  actions: [],
  assumptions: [],
  missingInformation: [],
};

function service(): DashboardAIService {
  return {
    proposeDashboard: vi.fn(async () => ({
      proposal,
      validation: { valid: true, canApply: true, errors: [], warnings: [] },
      preview: { title: "Sales", cards: [] },
      dashboardId: "dashboard-1",
      revision: "1",
    })),
    validateProposal: vi.fn(async () => ({
      valid: true,
      canApply: true,
      errors: [],
      warnings: [],
    })),
    applyProposal: vi.fn(async () => ({
      id: "dashboard-1",
      ownerUserId: "user-1",
      title: "Sales",
      isDefault: true,
      revision: 2,
      cards: [],
    })),
  };
}

function request(body: unknown) {
  return new Request("http://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("createDashboardAIHandlers", () => {
  it("returns a proposal preview without applying it", async () => {
    const ai = service();
    const response = await createDashboardAIHandlers({
      service: ai,
    }).proposeDashboard(request({ prompt: "Create a sales dashboard" }), {
      userId: "user-1",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      proposal: { title: "Sales" },
      validation: { canApply: true },
    });
    expect(ai.applyProposal).not.toHaveBeenCalled();
  });

  it("validates and serializes an explicitly applied proposal", async () => {
    const ai = service();
    const response = await createDashboardAIHandlers({
      service: ai,
    }).applyDashboardProposal(
      request({ proposal, dashboardId: "dashboard-1", revision: "1" }),
      { userId: "user-1", principalId: "user-1" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "dashboard-1",
      revision: "2",
      config: { title: "Sales", cards: [] },
    });
    expect(ai.applyProposal).toHaveBeenCalledTimes(1);
  });

  it("returns a typed permission error", async () => {
    const ai = service();
    vi.mocked(ai.proposeDashboard).mockRejectedValue(
      new DashboardAIError("AI_PERMISSION_DENIED", "Permission denied"),
    );
    const response = await createDashboardAIHandlers({
      service: ai,
    }).proposeDashboard(request({ prompt: "Create" }), {
      userId: "user-1",
      principalId: "user-1",
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "AI_PERMISSION_DENIED", message: "Permission denied" },
    });
  });

  it("rejects an invalid request before invoking the service", async () => {
    const ai = service();
    const response = await createDashboardAIHandlers({
      service: ai,
    }).proposeDashboard(request({ prompt: "" }), {
      userId: "user-1",
      principalId: "user-1",
    });

    expect(response.status).toBe(400);
    expect(ai.proposeDashboard).not.toHaveBeenCalled();
  });
});
