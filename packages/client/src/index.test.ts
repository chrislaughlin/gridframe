import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DashboardClientError,
  bootstrapDashboard,
  applyDashboardProposal,
  fetchDashboardCardData,
  proposeDashboard,
  updateDashboardGlobalFilter,
  updateDashboardLayout,
} from "./index";

const bootstrapResponse = {
  dashboards: [{ id: "dashboard-1", title: "Operations", isDefault: true }],
  dashboard: {
    id: "dashboard-1",
    revision: "1",
    config: {
      title: "Operations",
      cards: [
        {
          id: "card-1",
          name: "Revenue",
          visualization: "metric",
          query:
            "/api/gridframe/users/user%2F1/dashboards/dashboard-1/cards/card-1/data",
          layout: { x: 0, y: 0, width: 1, height: 2 },
        },
      ],
    },
  },
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bootstrapDashboard", () => {
  it("constructs the owner-scoped URL, forwards abort, and validates JSON", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bootstrapResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      bootstrapDashboard({
        userId: "user/1",
        dashboardId: "dashboard-1",
        apiBaseUrl: "/custom/",
        signal,
      }),
    ).resolves.toEqual(bootstrapResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "/custom/users/user%2F1/dashboards/bootstrap",
      expect.objectContaining({
        body: JSON.stringify({ dashboardId: "dashboard-1" }),
        method: "POST",
        signal,
      }),
    );
  });

  it("rejects a malformed successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ dashboard: null }), { status: 200 }),
        ),
    );

    await expect(bootstrapDashboard({ userId: "user-1" })).rejects.toThrow(
      "Dashboard API returned an invalid response",
    );
  });

  it("throws a typed error for a non-success response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "DASHBOARD_NOT_FOUND",
              message: "Dashboard not found",
            },
          }),
          { status: 404 },
        ),
      ),
    );

    const error = await bootstrapDashboard({ userId: "user-1" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(DashboardClientError);
    expect(error).toMatchObject({
      status: 404,
      code: "DASHBOARD_NOT_FOUND",
      message: "Dashboard not found",
    });
  });
});

describe("fetchDashboardCardData", () => {
  it("requests source data through the owner-scoped Card endpoint", async () => {
    const response = {
      status: "success",
      data: { visualization: "metric", value: 42 },
      sourceData: {
        columns: [{ key: "value", label: "Value" }],
        rows: [{ value: 42 }],
      },
    } as const;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchDashboardCardData({
        userId: "user-1",
        dashboardId: "dashboard-1",
        cardId: "card-1",
        includeSource: true,
      }),
    ).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gridframe/users/user-1/dashboards/dashboard-1/cards/card-1/data?includeSource=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects success without source data when source data was requested", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "success",
            data: { visualization: "metric", value: 42 },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      fetchDashboardCardData({
        userId: "user-1",
        dashboardId: "dashboard-1",
        cardId: "card-1",
        includeSource: true,
      }),
    ).rejects.toThrow("Dashboard API returned an invalid response");
  });
});

describe("updateDashboardLayout", () => {
  it("submits the complete owner-scoped layout and validates the Dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bootstrapResponse.dashboard), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const cards = [{ id: "card-1", x: 0, y: 0, width: 1, height: 2 }];

    await expect(
      updateDashboardLayout({
        userId: "user/1",
        dashboardId: "dashboard-1",
        revision: "1",
        cards,
      }),
    ).resolves.toEqual(bootstrapResponse.dashboard);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gridframe/users/user%2F1/dashboards/dashboard-1/layout",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ revision: "1", cards }),
      }),
    );
  });
});

describe("updateDashboardGlobalFilter", () => {
  it("updates a user-selected global filter value", async () => {
    const updated = {
      ...bootstrapResponse.dashboard,
      revision: "2",
      config: {
        ...bootstrapResponse.dashboard.config,
        globalFilters: [
          {
            id: "region",
            field: "region",
            operator: "equals" as const,
            value: "North",
          },
        ],
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(updated)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateDashboardGlobalFilter({
        userId: "user-1",
        dashboardId: "dashboard-1",
        filterId: "region",
        revision: "1",
        value: "North",
      }),
    ).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gridframe/users/user-1/dashboards/dashboard-1/global-filters/region",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ revision: "1", value: "North" }),
      }),
    );
  });
});

describe("Dashboard AI", () => {
  it("requests a proposal without including provider credentials", async () => {
    const proposalResponse = {
      proposal: {
        version: 1,
        title: "Sales",
        intent: { objective: "Track sales" },
        actions: [],
        assumptions: [],
        missingInformation: [],
      },
      validation: { valid: true, canApply: true, errors: [], warnings: [] },
      preview: { title: "Sales", cards: [] },
      dashboardId: "dashboard-1",
      revision: "1",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(proposalResponse)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      proposeDashboard({
        userId: "user/1",
        prompt: "Create a sales dashboard",
        dashboardId: "dashboard-1",
        revision: "1",
      }),
    ).resolves.toEqual(proposalResponse);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gridframe/users/user%2F1/ai/dashboard-proposals",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: "Create a sales dashboard",
      dashboardId: "dashboard-1",
      revision: "1",
    });
    expect(String(init.body)).not.toMatch(/apiKey|OPENROUTER|server-secret/i);
  });

  it("applies a reviewed proposal through the same typed client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "dashboard-1",
          revision: "2",
          config: { title: "Sales", cards: [] },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const proposal = {
      version: 1 as const,
      title: "Sales",
      intent: { objective: "Track sales" },
      actions: [],
      assumptions: [],
      missingInformation: [],
    };

    await applyDashboardProposal({
      userId: "user-1",
      dashboardId: "dashboard-1",
      revision: "1",
      proposal,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gridframe/users/user-1/ai/dashboard-proposals/apply",
      expect.objectContaining({
        body: JSON.stringify({
          proposal,
          dashboardId: "dashboard-1",
          revision: "1",
        }),
      }),
    );
  });
});
