// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { DashboardDrillDown, PanelDashboard } from "@gridframe/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDashboardHandlers } from "@gridframe/server";

import { cardLibrary, resolveExampleCardData } from "./card-definitions";
import { defaultDashboardSeed } from "./seed";
import {
  createTestRepository,
  deleteTestDashboards,
  hasTestDatabase,
} from "./test-database";

const owner = "dashboard-flow-test-user";

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
  const repository = createTestRepository();
  const handlers = createDashboardHandlers({
    repository,
    cardLibrary,
    defaultDashboard: () => defaultDashboardSeed,
    resolveCardData: resolveExampleCardData,
  });

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(
        new URL(String(input), "http://localhost"),
        init,
      );
      const segments = new URL(request.url).pathname.split("/").filter(Boolean);

      if (segments.at(-1) === "bootstrap") {
        return handlers.bootstrap(request, {
          userId: decodeURIComponent(segments[3] ?? ""),
        });
      }

      if (segments.at(-1) === "card-library") {
        return handlers.listCardLibrary(request, {
          userId: decodeURIComponent(segments[3] ?? ""),
          dashboardId: decodeURIComponent(segments[5] ?? ""),
        });
      }

      const userId = decodeURIComponent(segments[3] ?? "");
      const dashboardId = decodeURIComponent(segments[5] ?? "");
      const cardId = decodeURIComponent(segments[7] ?? "");
      return handlers.fetchCardData(request, { userId, dashboardId, cardId });
    }),
  );
});

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await deleteTestDashboards([owner]);
});

describe.skipIf(!hasTestDatabase)("API-backed Dashboard flow", () => {
  it("bootstraps a user and renders every seeded Card through the Dashboard API", async () => {
    render(createElement(PanelDashboard, { dashboard: { userId: owner } }));

    expect(
      await screen.findByRole(
        "heading",
        { name: "Operations overview" },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Total revenue")).toBeInTheDocument();
    expect(await screen.findByText("Revenue by region")).toBeInTheDocument();
    expect(await screen.findByText("Recent orders")).toBeInTheDocument();
    expect(
      await screen.findByText("Across all example orders"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Order Id")).toBeInTheDocument();
    expect(await screen.findByText("North")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(5);
  }, 20_000);

  it("opens a Card Deeplink with the same Visualization and its source data", async () => {
    render(createElement(PanelDashboard, { dashboard: { userId: owner } }));
    const link = await screen.findByRole(
      "link",
      {
        name: "View revenue source data",
      },
      { timeout: 10_000 },
    );
    const href = link.getAttribute("href")!;
    const [, userId, dashboardId, cardId] =
      href.match(/users\/([^/]+)\/dashboards\/([^/]+)\/cards\/([^/]+)/) ?? [];
    expect(userId && dashboardId && cardId).toBeTruthy();

    cleanup();
    render(
      createElement(DashboardDrillDown, {
        userId: userId!,
        dashboardId: dashboardId!,
        cardId: cardId!,
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Total revenue" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Source data" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="drill-down-visualization"]'),
    ).toHaveClass("h-96");
    expect(
      await screen.findByRole("columnheader", { name: "Amount" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Dashboard" }),
    ).toHaveAttribute(
      "href",
      `/gridframe/users/${userId}/dashboards/${dashboardId}`,
    );
  }, 20_000);
});
