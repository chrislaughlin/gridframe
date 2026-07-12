// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Layout } from "react-grid-layout";
import type { ReactNode } from "react";

vi.mock("react-grid-layout", () => ({
  default: ({
    children,
    layout,
    onDragStop,
  }: {
    children: ReactNode;
    layout: Layout;
    onDragStop?: (layout: Layout) => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onDragStop?.(
            layout.map((item) =>
              item.i === layout[0]?.i ? { ...item, y: item.y + 2 } : item,
            ),
          )
        }
        type="button"
      >
        Finish moving cards
      </button>
      <output data-testid="grid-layout">
        {JSON.stringify(layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))}
      </output>
      {children}
    </div>
  ),
  useContainerWidth: () => ({
    containerRef: { current: null },
    mounted: true,
    width: 1024,
  }),
}));

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
  it("adds an available Card from the Card library", async () => {
    const bootstrap = apiBootstrap();
    let resolveAdd!: (response: Response) => void;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap"))
          return new Response(JSON.stringify(bootstrap));
        if (url.endsWith("/card-library"))
          return new Response(
            JSON.stringify({
              items: [
                {
                  key: "revenue-by-region",
                  name: "Revenue by region",
                  visualization: "bar",
                  defaultLayout: { width: 3, height: 4 },
                },
              ],
            }),
          );
        if (url.endsWith("/cards") && init?.method === "POST")
          return new Promise<Response>((resolve) => {
            resolveAdd = resolve;
          });
        return new Response(
          JSON.stringify(responseFor(url.split("/").at(-2) ?? "metric")),
        );
      },
    );
    const addResponse = new Response(
      JSON.stringify({
        dashboard: {
          ...bootstrap.dashboard,
          revision: "2",
          config: {
            ...bootstrap.dashboard.config,
            cards: [
              ...bootstrap.dashboard.config.cards,
              apiCard("bar", "Revenue by region", "bar", 1, 3, 4),
            ],
          },
        },
        cardLibrary: {
          items: [
            {
              key: "revenue-by-region",
              name: "Revenue by region",
              visualization: "bar",
              defaultLayout: { width: 3, height: 4 },
              addedCardId: "bar",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);
    await screen.findByText("Total revenue");
    fireEvent.click(screen.getByRole("button", { name: "Card library" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add" }));
    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-panel-card-id="pending:revenue-by-region"]',
        ),
      ).toBeInTheDocument();
    });
    resolveAdd(addResponse);
    await waitFor(() => {
      expect(
        document.querySelector('[data-panel-card-id="bar"]'),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/cards$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          revision: "1",
          libraryItemKey: "revenue-by-region",
        }),
      }),
    );
  });

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

  it("optimistically renames a Card and commits the server revision", async () => {
    const bootstrap = apiBootstrap();
    let resolveMutation!: (response: Response) => void;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap")) {
          return new Response(JSON.stringify(bootstrap), { status: 200 });
        }
        if (init?.method === "PATCH") {
          return new Promise<Response>((resolve) => {
            resolveMutation = resolve;
          });
        }
        return new Response(JSON.stringify(responseFor("metric")), {
          status: 200,
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);
    await screen.findByText("Total revenue");
    const card = screen
      .getByText("Total revenue")
      .closest("[data-panel-card-id]");
    expect(card).not.toHaveAttribute("data-panel-card-editing");
    fireEvent.click(screen.getByRole("button", { name: "Edit card name" }));
    const input = screen.getByRole("textbox", { name: "Card name" });
    expect(card).toHaveAttribute("data-panel-card-editing", "true");
    fireEvent.change(input, { target: { value: "Net revenue" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Net revenue")).toBeInTheDocument();
    expect(card).not.toHaveAttribute("data-panel-card-editing");
    expect(
      screen.getByRole("button", { name: "Edit card name" }),
    ).toBeDisabled();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/gridframe/users/user-1/dashboards/dashboard-1/cards/metric",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ revision: "1", name: "Net revenue" }),
        }),
      );
    });

    resolveMutation(
      new Response(
        JSON.stringify({
          ...bootstrap.dashboard,
          revision: "2",
          config: {
            ...bootstrap.dashboard.config,
            cards: [
              { ...bootstrap.dashboard.config.cards[0], name: "Net revenue" },
            ],
          },
        }),
        { status: 200 },
      ),
    );
    await waitFor(() => {
      expect(screen.getByText("Net revenue")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Edit card name" }),
      ).toBeEnabled();
    });
  });

  it("submits the complete layout only when moving finishes", async () => {
    const bootstrap = apiBootstrap();
    let resolveMutation!: (response: Response) => void;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap")) {
          return new Response(JSON.stringify(bootstrap), { status: 200 });
        }
        if (init?.method === "PATCH") {
          return new Promise<Response>((resolve) => {
            resolveMutation = resolve;
          });
        }
        return new Response(JSON.stringify(responseFor("metric")), {
          status: 200,
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);
    await screen.findByText("Total revenue");
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH"),
    ).toHaveLength(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Finish moving cards" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/gridframe/users/user-1/dashboards/dashboard-1/layout",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            revision: "1",
            cards: [{ id: "metric", x: 0, y: 2, width: 1, height: 2 }],
          }),
        }),
      );
    });
    expect(screen.getByTestId("grid-layout")).toHaveTextContent('"y":2');
    resolveMutation(
      new Response(
        JSON.stringify({
          ...bootstrap.dashboard,
          revision: "2",
          config: {
            ...bootstrap.dashboard.config,
            cards: [
              {
                ...bootstrap.dashboard.config.cards[0],
                layout: { x: 0, y: 2, width: 1, height: 2 },
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );
  });

  it("rolls back a failed rename and offers retry", async () => {
    const bootstrap = apiBootstrap();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap"))
          return new Response(JSON.stringify(bootstrap), { status: 200 });
        if (init?.method === "PATCH")
          return new Response(
            JSON.stringify({
              error: {
                code: "DASHBOARD_LOAD_FAILED",
                message: "Could not save edit",
              },
            }),
            { status: 500 },
          );
        return new Response(JSON.stringify(responseFor("metric")), {
          status: 200,
        });
      }),
    );

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);
    await screen.findByText("Total revenue");
    fireEvent.click(screen.getByRole("button", { name: "Edit card name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Card name" }), {
      target: { value: "Net revenue" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Card name" }), {
      key: "Enter",
    });

    expect(await screen.findByText("Could not save edit")).toBeInTheDocument();
    expect(screen.getByText("Total revenue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("refetches and replaces a rename after a revision conflict", async () => {
    const bootstrap = apiBootstrap();
    let bootstrapCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/dashboards/bootstrap")) {
          bootstrapCalls += 1;
          const name =
            bootstrapCalls > 1
              ? "Revenue from another session"
              : "Total revenue";
          return new Response(
            JSON.stringify({
              ...bootstrap,
              dashboard: {
                ...bootstrap.dashboard,
                revision: bootstrapCalls > 1 ? "2" : "1",
                config: {
                  ...bootstrap.dashboard.config,
                  cards: [{ ...bootstrap.dashboard.config.cards[0], name }],
                },
              },
            }),
            { status: 200 },
          );
        }
        if (init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              error: { code: "REVISION_CONFLICT", message: "Conflict" },
            }),
            { status: 409 },
          );
        }
        return new Response(JSON.stringify(responseFor("metric")), {
          status: 200,
        });
      }),
    );

    render(<PanelDashboard dashboard={{ userId: "user-1" }} />);
    await screen.findByText("Total revenue");
    fireEvent.click(screen.getByRole("button", { name: "Edit card name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Card name" }), {
      target: { value: "My edit" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Card name" }), {
      key: "Enter",
    });

    expect(
      await screen.findByText("Newer Dashboard changes replaced your edit."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Revenue from another session"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
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

function apiBootstrap() {
  return {
    dashboards: [{ id: "dashboard-1", title: "Operations", isDefault: true }],
    dashboard: {
      id: "dashboard-1",
      revision: "1",
      config: {
        title: "Operations",
        cards: [apiCard("metric", "Total revenue", "metric", 0, 1, 2)],
      },
    },
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
