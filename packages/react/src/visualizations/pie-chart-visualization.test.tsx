// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PieChartVisualization } from "./pie-chart-visualization";

class ResizeObserverMock implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect() {}

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 320,
            height: 160,
            x: 0,
            y: 0,
            top: 0,
            right: 320,
            bottom: 160,
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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PieChartVisualization", () => {
  it("fills the available Card preview width", () => {
    const { container } = render(
      <PieChartVisualization
        data={{
          visualization: "pie",
          nameKey: "segment",
          valueKey: "value",
          data: [
            { segment: "Direct", value: 42 },
            { segment: "Search", value: 31 },
          ],
          series: [
            { key: "Direct", label: "Direct", color: "var(--chart-1)" },
            { key: "Search", label: "Search", color: "var(--chart-2)" },
          ],
          showLegend: false,
        }}
      />,
    );

    expect(container.firstElementChild).toHaveClass("h-full", "w-full");
  });

  it("keeps the real Visualization keyboard accessibility layer active", () => {
    const { container } = render(
      <PieChartVisualization
        data={{
          visualization: "pie",
          nameKey: "segment",
          valueKey: "value",
          data: [
            { segment: "Direct", value: 42 },
            { segment: "Search", value: 31 },
          ],
          series: [
            { key: "Direct", label: "Direct", color: "var(--chart-1)" },
            { key: "Search", label: "Search", color: "var(--chart-2)" },
          ],
          showLegend: false,
        }}
      />,
    );

    const chart = container.querySelector('[role="application"][tabindex="0"]');
    expect(chart).toBeInTheDocument();
    expect(chart?.closest("[inert]")).toBeNull();
  });
});
