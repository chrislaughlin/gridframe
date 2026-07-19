// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { DashboardDrillDown } from "./dashboard-drill-down";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders only the Source data section for a table Card", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.endsWith("/bootstrap")
        ? {
            dashboards: [
              { id: "dashboard-1", title: "Operations", isDefault: true },
            ],
            dashboard: {
              id: "dashboard-1",
              revision: "1",
              config: {
                title: "Operations",
                cards: [
                  {
                    id: "table-1",
                    name: "Recent orders",
                    visualization: "table",
                    query:
                      "/api/gridframe/users/user-1/dashboards/dashboard-1/cards/table-1/data",
                    layout: { x: 0, y: 0, width: 4, height: 4 },
                  },
                ],
              },
            },
          }
        : {
            status: "success",
            data: {
              visualization: "metric",
              value: 1,
            },
            sourceData: {
              columns: [{ key: "orderId", label: "Order Id" }],
              rows: [{ orderId: "ORD-001" }],
            },
          };

      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );

  render(
    <DashboardDrillDown
      userId="user-1"
      dashboardId="dashboard-1"
      cardId="table-1"
    />,
  );

  expect(
    await screen.findByRole("heading", { name: "Source data" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(
    document.querySelector('[data-slot="drill-down-visualization"]'),
  ).not.toBeInTheDocument();
});
