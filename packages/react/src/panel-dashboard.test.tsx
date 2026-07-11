// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
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
