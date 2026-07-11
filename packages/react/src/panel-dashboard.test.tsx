// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PanelDashboard } from "./panel-dashboard";
import { type PanelCardDataResponse, type PanelDashboardConfig } from "./types";

const cards = [
  { id: "metric", name: "Metric", visualization: "metric" },
  { id: "area", name: "Area", visualization: "area" },
  { id: "bar", name: "Bar", visualization: "bar" },
  { id: "line", name: "Line", visualization: "line" },
  { id: "pie", name: "Pie", visualization: "pie" },
  { id: "radar", name: "Radar", visualization: "radar" },
  { id: "radial", name: "Radial", visualization: "radial" },
  { id: "table", name: "Table", visualization: "table" },
] as const;

const config = {
  title: "Visualization compatibility",
  cards: cards.map((card) => ({
    ...card,
    query: `/api/cards/${card.id}`,
  })),
} satisfies PanelDashboardConfig;

class ResizeObserverMock implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect() {}

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 1024,
            height: 768,
            x: 0,
            y: 0,
            top: 0,
            right: 1024,
            bottom: 768,
            left: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }

  unobserve() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const id = String(input).split("/").at(-1) ?? "";
      return new Response(JSON.stringify(responseFor(id)), { status: 200 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PanelDashboard static mode", () => {
  it("renders every supported Visualization from a caller-owned config", async () => {
    render(<PanelDashboard config={config} />);

    expect(
      screen.getByRole("heading", { name: "Visualization compatibility" }),
    ).toBeInTheDocument();

    for (const card of cards) {
      expect(await screen.findByText(card.name)).toBeInTheDocument();
    }

    expect(fetch).toHaveBeenCalledTimes(cards.length);
  });
});

describe("PanelDashboard API-managed mode", () => {
  it("bootstraps and renders metric, chart, and table Cards", async () => {
    const bootstrap = {
      dashboards: [{ id: "dashboard-1", title: "Operations", isDefault: true }],
      dashboard: {
        id: "dashboard-1",
        revision: "1",
        config: {
          title: "Operations",
          cards: [
            apiCard("metric", "Total revenue", "metric", 0, 1, 2),
            apiCard("bar", "Revenue by region", "bar", 1, 3, 4),
            apiCard("table", "Recent orders", "table", 0, 4, 4),
          ],
        },
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap")) {
          return new Response(JSON.stringify(bootstrap), { status: 200 });
        }

        return new Response(
          JSON.stringify(responseFor(url.split("/").at(-2) ?? "")),
          { status: 200 },
        );
      }),
    );

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Operations" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Total revenue")).toBeInTheDocument();
    expect(await screen.findByText("Revenue by region")).toBeInTheDocument();
    expect(await screen.findByText("Recent orders")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/gridframe/users/user-1/dashboards/bootstrap",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renders a retryable bootstrap error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "DASHBOARD_LOAD_FAILED",
                message: "Dashboard could not be loaded",
              },
            }),
            { status: 500 },
          ),
      ),
    );

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);

    expect(
      await screen.findByText(
        "Dashboard could not be loaded",
        {},
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("switches an uncontrolled Dashboard and notifies the host", async () => {
    const onDashboardChange = vi.fn();
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const request = JSON.parse(String(init?.body)) as {
          dashboardId?: string;
        };
        const dashboardId = request.dashboardId ?? "dashboard-1";
        return new Response(
          JSON.stringify({
            dashboards: [
              { id: "dashboard-1", title: "Operations", isDefault: true },
              { id: "dashboard-2", title: "Sales", isDefault: false },
            ],
            dashboard: {
              id: dashboardId,
              revision: "1",
              config: {
                title: dashboardId === "dashboard-2" ? "Sales" : "Operations",
                cards: [],
              },
            },
          }),
          { status: 200 },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PanelDashboard dashboard={{ userId: "user-1", onDashboardChange }} />,
    );

    const selector = await screen.findByRole("combobox", { name: "Dashboard" });
    fireEvent.change(selector, { target: { value: "dashboard-2" } });

    expect(onDashboardChange).toHaveBeenCalledWith("dashboard-2");
    expect(
      await screen.findByRole("heading", { name: "Sales" }),
    ).toBeInTheDocument();
  });
});

function apiCard(
  id: string,
  name: string,
  visualization: "metric" | "bar" | "table",
  x: number,
  width: number,
  height: number,
) {
  return {
    id,
    name,
    visualization,
    query: `/api/gridframe/users/user-1/dashboards/dashboard-1/cards/${id}/data`,
    layout: { x, y: 0, width, height },
  };
}

function responseFor(id: string): PanelCardDataResponse {
  const chartData = [{ month: "January", value: 10 }];
  const series = [{ key: "value", label: "Value", color: "var(--chart-1)" }];

  switch (id) {
    case "metric":
      return {
        status: "success",
        data: { visualization: "metric", value: 10 },
      };
    case "area":
      return {
        status: "success",
        data: {
          visualization: "area",
          indexKey: "month",
          data: chartData,
          series,
        },
      };
    case "bar":
      return {
        status: "success",
        data: {
          visualization: "bar",
          indexKey: "month",
          data: chartData,
          series,
        },
      };
    case "line":
      return {
        status: "success",
        data: {
          visualization: "line",
          indexKey: "month",
          data: chartData,
          series,
        },
      };
    case "pie":
      return {
        status: "success",
        data: {
          visualization: "pie",
          nameKey: "month",
          valueKey: "value",
          data: chartData,
          series,
        },
      };
    case "radar":
      return {
        status: "success",
        data: {
          visualization: "radar",
          indexKey: "month",
          data: chartData,
          series,
        },
      };
    case "radial":
      return {
        status: "success",
        data: {
          visualization: "radial",
          nameKey: "month",
          valueKey: "value",
          data: chartData,
          series,
        },
      };
    case "table":
      return {
        status: "success",
        data: {
          visualization: "table",
          columns: [{ key: "value", label: "Value" }],
          rows: [{ value: 10 }],
        },
      };
    default:
      return { status: "error", message: "Unknown fixture" };
  }
}
