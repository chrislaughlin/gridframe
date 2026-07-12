// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { DashboardDrillDown, PanelDashboard } from "@gridframe/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBootstrapHandler } from "./bootstrap-handler";
import { createCardLibraryHandler } from "./card-library-handler";
import { createCardDataHandler } from "./card-data-handler";
import { createConsumerCardHandler } from "./consumer-handler";
import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";

let database: ReturnType<typeof openDashboardDatabase>;

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
  database = openDashboardDatabase(":memory:");
  const repository = new SqliteDashboardRepository(database);
  const consumerHandler = createConsumerCardHandler();
  const bootstrapHandler = createBootstrapHandler(repository);
  const cardHandler = createCardDataHandler(repository, async (input) =>
    consumerHandler(new URL(input).pathname.split("/").at(-1) ?? ""),
  );
  const cardLibraryHandler = createCardLibraryHandler(repository);

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
        return bootstrapHandler(request, decodeURIComponent(segments[3] ?? ""));
      }

      if (segments.at(-1) === "card-library") {
        return cardLibraryHandler(
          request,
          decodeURIComponent(segments[3] ?? ""),
          decodeURIComponent(segments[5] ?? ""),
        );
      }

      const userId = decodeURIComponent(segments[3] ?? "");
      const dashboardId = decodeURIComponent(segments[5] ?? "");
      const cardId = decodeURIComponent(segments[7] ?? "");
      return cardHandler(request, { userId, dashboardId, cardId });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  database.close();
});

describe("API-backed Dashboard flow", () => {
  it("bootstraps a user and renders every seeded Card through the Dashboard API", async () => {
    render(createElement(PanelDashboard, { dashboard: { userId: "user-1" } }));

    expect(
      await screen.findByRole("heading", { name: "Operations overview" }),
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
  });

  it("opens a Card Deeplink with the same Visualization and its source data", async () => {
    render(createElement(PanelDashboard, { dashboard: { userId: "user-1" } }));
    const link = await screen.findByRole("link", {
      name: "View revenue source data",
    });
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
  });
});
